-- Email Muse v2 backend foundation.
-- This migration is intentionally additive so existing production data remains usable.

-- -----------------------------------------------------------------------------
-- Harden legacy account and credit projections
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_source text NOT NULL DEFAULT 'free';

-- Every non-free legacy value is untrusted because v1 allowed clients to edit
-- the plan column. Administrators may explicitly set plan_source='manual' only
-- after this migration; Stripe reconciliation handles all other paid plans.
UPDATE public.profiles
SET plan_source = CASE
  WHEN plan = 'free' THEN 'free'
  ELSE 'legacy'
END
WHERE plan_source = 'free' AND plan <> 'free';

-- v1 exposed every credit column to authenticated clients, so no legacy balance
-- is authoritative. Start from the free safety ceiling; a verified Stripe
-- subscription is restored once by check-subscription/webhook for its real cycle.
UPDATE public.user_credits
SET emails_remaining = LEAST(GREATEST(emails_remaining, 0), 5),
    emails_monthly_limit = 5,
    analyses_remaining = LEAST(GREATEST(analyses_remaining, 0), 1),
    analyses_monthly_limit = 1,
    extra_emails = 0,
    extra_analyses = 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_source_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_source_check
  CHECK (plan_source IN ('free', 'stripe', 'manual', 'legacy')) NOT VALID;

ALTER TABLE public.user_credits
  DROP CONSTRAINT IF EXISTS user_credits_nonnegative_v2;
ALTER TABLE public.user_credits
  DROP CONSTRAINT IF EXISTS user_credits_balances_v2;
ALTER TABLE public.user_credits
  ADD CONSTRAINT user_credits_balances_v2 CHECK (
    emails_remaining >= 0
    AND emails_monthly_limit >= 0
    AND analyses_remaining >= 0
    AND analyses_monthly_limit >= 0
    -- Refunds and chargebacks may create an extra-credit debt when the
    -- purchased credits were already consumed. Future grants pay this debt
    -- before becoming spendable, so a reversal cannot mint credits later.
    AND extra_emails BETWEEN -1000000 AND 1000000
    AND extra_analyses BETWEEN -1000000 AND 1000000
  ) NOT VALID;

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;
DROP POLICY IF EXISTS "Users can update their referrals" ON public.referrals;

CREATE POLICY "Users can update safe profile fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

REVOKE ALL ON public.user_credits FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_credits TO authenticated;

REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

REVOKE ALL ON public.referrals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.referrals TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- RPCs found in older remote schemas must not remain client-callable.
DO $revoke_legacy_credit_rpcs$
BEGIN
  IF to_regprocedure('public.consume_email_credit(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.consume_email_credit(uuid) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.consume_email_credit(uuid) TO service_role';
  END IF;

  IF to_regprocedure('public.consume_analysis_credit(uuid)') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.consume_analysis_credit(uuid) FROM PUBLIC, anon, authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.consume_analysis_credit(uuid) TO service_role';
  END IF;
END;
$revoke_legacy_credit_rpcs$;

-- -----------------------------------------------------------------------------
-- Auditable credits, idempotent generation jobs, and Stripe state
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_type text NOT NULL CHECK (
    job_type IN ('email_generation', 'funnel_generation', 'block_text_generation', 'site_analysis')
  ),
  credit_type text NOT NULL CHECK (credit_type IN ('email', 'analysis')),
  credits_reserved integer NOT NULL CHECK (credits_reserved > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (
    status IN ('reserved', 'processing', 'succeeded', 'failed')
  ),
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 200),
  request_fingerprint text,
  result jsonb,
  error_code text,
  error_message text,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS generation_jobs_user_created_idx
  ON public.generation_jobs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generation_jobs_status_idx
  ON public.generation_jobs (status, created_at)
  WHERE status IN ('reserved', 'processing');

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generation_job_id uuid REFERENCES public.generation_jobs(id) ON DELETE SET NULL,
  credit_type text NOT NULL CHECK (credit_type IN ('email', 'analysis')),
  bucket text NOT NULL CHECK (bucket IN ('monthly', 'extra')),
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after integer NOT NULL CHECK (balance_after BETWEEN -1000000 AND 1000000),
  reason text NOT NULL CHECK (
    reason IN (
      'migration_opening',
      'signup_grant',
      'reservation',
      'refund',
      'subscription_cycle',
      'subscription_adjustment',
      'purchase',
      'purchase_refund',
      'purchase_refund_reversal',
      'chargeback',
      'chargeback_reversal',
      'referral',
      'admin_adjustment'
    )
  ),
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 240),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key, credit_type, bucket)
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_created_idx
  ON public.credit_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_ledger_job_idx
  ON public.credit_ledger (generation_job_id)
  WHERE generation_job_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  stripe_product_id text,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_customers_customer_idx
  ON public.billing_customers (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.subscription_credit_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz,
  plan public.subscription_plan NOT NULL,
  source_event_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stripe_subscription_id, period_start)
);

CREATE TABLE IF NOT EXISTS public.stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processing_status text NOT NULL DEFAULT 'processing' CHECK (
    processing_status IN ('processing', 'processed', 'failed', 'ignored')
  ),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_events_status_idx
  ON public.stripe_events (processing_status, created_at);

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (char_length(action) BETWEEN 1 AND 100),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  last_request_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, action)
);

ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_credit_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their generation jobs" ON public.generation_jobs;
CREATE POLICY "Users can view their generation jobs"
  ON public.generation_jobs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their credit ledger" ON public.credit_ledger;
CREATE POLICY "Users can view their credit ledger"
  ON public.credit_ledger
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their billing state" ON public.billing_customers;
CREATE POLICY "Users can view their billing state"
  ON public.billing_customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.generation_jobs FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.credit_ledger FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.billing_customers FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.subscription_credit_cycles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.stripe_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.generation_jobs, public.credit_ledger, public.billing_customers TO authenticated;

-- Capture existing balances as the opening audit entries.
INSERT INTO public.credit_ledger (
  user_id, credit_type, bucket, amount, balance_after, reason, idempotency_key
)
SELECT user_id, 'email', 'monthly', emails_remaining, emails_remaining,
       'migration_opening', 'migration:v2:opening'
FROM public.user_credits
WHERE emails_remaining > 0
ON CONFLICT DO NOTHING;

INSERT INTO public.credit_ledger (
  user_id, credit_type, bucket, amount, balance_after, reason, idempotency_key
)
SELECT user_id, 'email', 'extra', extra_emails, extra_emails,
       'migration_opening', 'migration:v2:opening'
FROM public.user_credits
WHERE extra_emails > 0
ON CONFLICT DO NOTHING;

INSERT INTO public.credit_ledger (
  user_id, credit_type, bucket, amount, balance_after, reason, idempotency_key
)
SELECT user_id, 'analysis', 'monthly', analyses_remaining, analyses_remaining,
       'migration_opening', 'migration:v2:opening'
FROM public.user_credits
WHERE analyses_remaining > 0
ON CONFLICT DO NOTHING;

INSERT INTO public.credit_ledger (
  user_id, credit_type, bucket, amount, balance_after, reason, idempotency_key
)
SELECT user_id, 'analysis', 'extra', extra_analyses, extra_analyses,
       'migration_opening', 'migration:v2:opening'
FROM public.user_credits
WHERE extra_analyses > 0
ON CONFLICT DO NOTHING;

-- Reserve credits and create a job in one database transaction. Only service_role
-- can execute this function; callers cannot choose another user's balance.
CREATE OR REPLACE FUNCTION public.reserve_generation_credits(
  p_user_id uuid,
  p_job_type text,
  p_credit_type text,
  p_amount integer,
  p_idempotency_key text,
  p_request_fingerprint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_job public.generation_jobs%ROWTYPE;
  v_job_id uuid;
  v_monthly integer;
  v_extra integer;
  v_take_monthly integer;
  v_take_extra integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_USER' USING ERRCODE = '22023';
  END IF;
  IF p_job_type NOT IN ('email_generation', 'funnel_generation', 'block_text_generation', 'site_analysis') THEN
    RAISE EXCEPTION 'INVALID_JOB_TYPE' USING ERRCODE = '22023';
  END IF;
  IF p_credit_type NOT IN ('email', 'analysis') OR p_amount IS NULL OR p_amount <= 0 OR p_amount > 100 THEN
    RAISE EXCEPTION 'INVALID_CREDIT_REQUEST' USING ERRCODE = '22023';
  END IF;
  IF p_idempotency_key IS NULL OR char_length(p_idempotency_key) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'INVALID_IDEMPOTENCY_KEY' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.generation_jobs (
    user_id, job_type, credit_type, credits_reserved, idempotency_key, request_fingerprint
  )
  VALUES (
    p_user_id, p_job_type, p_credit_type, p_amount, p_idempotency_key, p_request_fingerprint
  )
  ON CONFLICT (user_id, idempotency_key) DO NOTHING
  RETURNING id INTO v_job_id;

  IF v_job_id IS NULL THEN
    SELECT * INTO v_job
    FROM public.generation_jobs
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;

    IF v_job.id IS NULL THEN
      RAISE EXCEPTION 'IDEMPOTENCY_LOOKUP_FAILED' USING ERRCODE = 'P0001';
    END IF;
    IF v_job.job_type <> p_job_type
      OR v_job.credit_type <> p_credit_type
      OR v_job.credits_reserved <> p_amount
      OR (
        v_job.request_fingerprint IS NOT NULL
        AND p_request_fingerprint IS NOT NULL
        AND v_job.request_fingerprint <> p_request_fingerprint
      ) THEN
      RAISE EXCEPTION 'IDEMPOTENCY_CONFLICT' USING ERRCODE = 'P0001';
    END IF;

    RETURN jsonb_build_object(
      'job_id', v_job.id,
      'status', v_job.status,
      'already_processed', true,
      'result', v_job.result
    );
  END IF;

  INSERT INTO public.user_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT
    CASE WHEN p_credit_type = 'email' THEN emails_remaining ELSE analyses_remaining END,
    CASE WHEN p_credit_type = 'email' THEN extra_emails ELSE extra_analyses END
  INTO v_monthly, v_extra
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF COALESCE(v_monthly, 0) + COALESCE(v_extra, 0) < p_amount THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS' USING ERRCODE = 'P0001';
  END IF;

  -- Monthly credits expire first, so consume them before durable extras.
  v_take_monthly := LEAST(v_monthly, p_amount);
  v_take_extra := p_amount - v_take_monthly;

  IF p_credit_type = 'email' THEN
    UPDATE public.user_credits
    SET emails_remaining = emails_remaining - v_take_monthly,
        extra_emails = extra_emails - v_take_extra
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_credits
    SET analyses_remaining = analyses_remaining - v_take_monthly,
        extra_analyses = extra_analyses - v_take_extra
    WHERE user_id = p_user_id;
  END IF;

  IF v_take_monthly > 0 THEN
    INSERT INTO public.credit_ledger (
      user_id, generation_job_id, credit_type, bucket, amount, balance_after,
      reason, idempotency_key, metadata
    ) VALUES (
      p_user_id, v_job_id, p_credit_type, 'monthly', -v_take_monthly,
      v_monthly - v_take_monthly, 'reservation', p_idempotency_key,
      jsonb_build_object('job_type', p_job_type)
    );
  END IF;

  IF v_take_extra > 0 THEN
    INSERT INTO public.credit_ledger (
      user_id, generation_job_id, credit_type, bucket, amount, balance_after,
      reason, idempotency_key, metadata
    ) VALUES (
      p_user_id, v_job_id, p_credit_type, 'extra', -v_take_extra,
      v_extra - v_take_extra, 'reservation', p_idempotency_key,
      jsonb_build_object('job_type', p_job_type)
    );
  END IF;

  RETURN jsonb_build_object(
    'job_id', v_job_id,
    'status', 'reserved',
    'already_processed', false,
    'result', NULL
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_api_rate_limit(
  p_user_id uuid,
  p_action text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_row public.api_rate_limits%ROWTYPE;
  v_now timestamptz := clock_timestamp();
  v_window interval;
BEGIN
  IF p_user_id IS NULL
    OR p_action IS NULL
    OR char_length(p_action) NOT BETWEEN 1 AND 100
    OR p_max_requests NOT BETWEEN 1 AND 1000
    OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'INVALID_RATE_LIMIT' USING ERRCODE = '22023';
  END IF;
  v_window := make_interval(secs => p_window_seconds);

  INSERT INTO public.api_rate_limits (
    user_id, action, window_started_at, request_count, last_request_at
  ) VALUES (p_user_id, p_action, v_now, 1, v_now)
  ON CONFLICT (user_id, action) DO UPDATE SET
    window_started_at = CASE
      WHEN api_rate_limits.window_started_at + v_window <= v_now THEN v_now
      ELSE api_rate_limits.window_started_at
    END,
    request_count = CASE
      WHEN api_rate_limits.window_started_at + v_window <= v_now THEN 1
      ELSE api_rate_limits.request_count + 1
    END,
    last_request_at = v_now
  RETURNING * INTO v_row;

  IF v_row.request_count > p_max_requests THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED' USING
      ERRCODE = 'P0001',
      DETAIL = jsonb_build_object(
        'action', p_action,
        'retry_after_seconds', GREATEST(
          1,
          ceil(extract(epoch FROM (v_row.window_started_at + v_window - v_now)))::integer
        )
      )::text;
  END IF;

  RETURN jsonb_build_object(
    'remaining', p_max_requests - v_row.request_count,
    'reset_at', v_row.window_started_at + v_window
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_generation_job_processing(
  p_user_id uuid,
  p_job_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.generation_jobs
  SET status = 'processing', started_at = COALESCE(started_at, now()), updated_at = now()
  WHERE id = p_job_id AND user_id = p_user_id AND status = 'reserved';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GENERATION_JOB_NOT_RESERVABLE' USING ERRCODE = 'P0001';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_generation_job(
  p_user_id uuid,
  p_job_id uuid,
  p_result jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  UPDATE public.generation_jobs
  SET status = 'succeeded',
      result = p_result,
      completed_at = now(),
      updated_at = now(),
      error_code = NULL,
      error_message = NULL
  WHERE id = p_job_id
    AND user_id = p_user_id
    AND status IN ('reserved', 'processing')
    AND refunded_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GENERATION_JOB_NOT_COMPLETABLE' USING ERRCODE = 'P0001';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refund_generation_credits(
  p_user_id uuid,
  p_job_id uuid,
  p_error_code text,
  p_error_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_job public.generation_jobs%ROWTYPE;
  v_monthly_refund integer := 0;
  v_extra_refund integer := 0;
  v_monthly_balance integer;
  v_extra_balance integer;
  v_monthly_limit integer;
BEGIN
  SELECT * INTO v_job
  FROM public.generation_jobs
  WHERE id = p_job_id AND user_id = p_user_id
  FOR UPDATE;

  IF v_job.id IS NULL THEN
    RAISE EXCEPTION 'GENERATION_JOB_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;
  IF v_job.status = 'succeeded' THEN
    RAISE EXCEPTION 'SUCCEEDED_JOB_CANNOT_BE_REFUNDED' USING ERRCODE = 'P0001';
  END IF;
  IF v_job.refunded_at IS NOT NULL THEN
    RETURN jsonb_build_object('job_id', v_job.id, 'already_refunded', true);
  END IF;

  SELECT
    COALESCE(SUM(-amount) FILTER (WHERE bucket = 'monthly' AND amount < 0), 0),
    COALESCE(SUM(-amount) FILTER (WHERE bucket = 'extra' AND amount < 0), 0)
  INTO v_monthly_refund, v_extra_refund
  FROM public.credit_ledger
  WHERE generation_job_id = p_job_id AND reason = 'reservation';

  SELECT
    CASE WHEN v_job.credit_type = 'email' THEN emails_remaining ELSE analyses_remaining END,
    CASE WHEN v_job.credit_type = 'email' THEN extra_emails ELSE extra_analyses END,
    CASE WHEN v_job.credit_type = 'email' THEN emails_monthly_limit ELSE analyses_monthly_limit END
  INTO v_monthly_balance, v_extra_balance, v_monthly_limit
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- A billing-cycle reset or downgrade may have happened after reservation.
  -- Never restore expired monthly credits beyond the user's current limit.
  v_monthly_refund := LEAST(
    v_monthly_refund,
    GREATEST(v_monthly_limit - v_monthly_balance, 0)
  );

  IF v_job.credit_type = 'email' THEN
    UPDATE public.user_credits
    SET emails_remaining = emails_remaining + v_monthly_refund,
        extra_emails = extra_emails + v_extra_refund
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_credits
    SET analyses_remaining = analyses_remaining + v_monthly_refund,
        extra_analyses = extra_analyses + v_extra_refund
    WHERE user_id = p_user_id;
  END IF;

  IF v_monthly_refund > 0 THEN
    INSERT INTO public.credit_ledger (
      user_id, generation_job_id, credit_type, bucket, amount, balance_after,
      reason, idempotency_key, metadata
    ) VALUES (
      p_user_id, p_job_id, v_job.credit_type, 'monthly', v_monthly_refund,
      v_monthly_balance + v_monthly_refund, 'refund',
      v_job.idempotency_key || ':refund',
      jsonb_build_object('error_code', COALESCE(p_error_code, 'GENERATION_FAILED'))
    );
  END IF;

  IF v_extra_refund > 0 THEN
    INSERT INTO public.credit_ledger (
      user_id, generation_job_id, credit_type, bucket, amount, balance_after,
      reason, idempotency_key, metadata
    ) VALUES (
      p_user_id, p_job_id, v_job.credit_type, 'extra', v_extra_refund,
      v_extra_balance + v_extra_refund, 'refund',
      v_job.idempotency_key || ':refund',
      jsonb_build_object('error_code', COALESCE(p_error_code, 'GENERATION_FAILED'))
    );
  END IF;

  UPDATE public.generation_jobs
  SET status = 'failed',
      error_code = left(COALESCE(p_error_code, 'GENERATION_FAILED'), 100),
      error_message = left(COALESCE(p_error_message, ''), 500),
      refunded_at = now(),
      completed_at = now(),
      updated_at = now()
  WHERE id = p_job_id;

  RETURN jsonb_build_object('job_id', v_job.id, 'already_refunded', false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.refund_stale_generation_jobs(
  p_user_id uuid,
  p_older_than_seconds integer DEFAULT 900
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_job record;
  v_refunded integer := 0;
BEGIN
  IF p_user_id IS NULL OR p_older_than_seconds NOT BETWEEN 300 AND 86400 THEN
    RAISE EXCEPTION 'INVALID_STALE_JOB_WINDOW' USING ERRCODE = '22023';
  END IF;

  FOR v_job IN
    SELECT id
    FROM public.generation_jobs
    WHERE user_id = p_user_id
      AND status IN ('reserved', 'processing')
      AND refunded_at IS NULL
      AND updated_at < now() - make_interval(secs => p_older_than_seconds)
    ORDER BY updated_at
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.refund_generation_credits(
      p_user_id,
      v_job.id,
      'GENERATION_TIMEOUT',
      'Generation job exceeded its processing window'
    );
    v_refunded := v_refunded + 1;
  END LOOP;

  RETURN v_refunded;
END;
$function$;

-- Used by Stripe webhooks for one-time packs, refunds, and chargebacks.
CREATE OR REPLACE FUNCTION public.apply_credit_adjustment(
  p_user_id uuid,
  p_credit_type text,
  p_bucket text,
  p_amount integer,
  p_reason text,
  p_idempotency_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_existing public.credit_ledger%ROWTYPE;
  v_balance integer;
  v_actual integer;
  v_new_balance integer;
BEGIN
  IF p_credit_type NOT IN ('email', 'analysis') OR p_bucket NOT IN ('monthly', 'extra') THEN
    RAISE EXCEPTION 'INVALID_CREDIT_BUCKET' USING ERRCODE = '22023';
  END IF;
  IF p_reason NOT IN (
    'purchase', 'purchase_refund', 'purchase_refund_reversal',
    'chargeback', 'chargeback_reversal', 'admin_adjustment', 'referral'
  ) THEN
    RAISE EXCEPTION 'INVALID_ADJUSTMENT_REASON' USING ERRCODE = '22023';
  END IF;
  IF p_amount IS NULL OR p_amount = 0 OR abs(p_amount) > 1000000 THEN
    RAISE EXCEPTION 'INVALID_ADJUSTMENT_AMOUNT' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_existing
  FROM public.credit_ledger
  WHERE user_id = p_user_id
    AND idempotency_key = p_idempotency_key
    AND credit_type = p_credit_type
    AND bucket = p_bucket;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'already_processed', true,
      'amount', v_existing.amount,
      'balance', v_existing.balance_after
    );
  END IF;

  INSERT INTO public.user_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT CASE
    WHEN p_credit_type = 'email' AND p_bucket = 'monthly' THEN emails_remaining
    WHEN p_credit_type = 'email' AND p_bucket = 'extra' THEN extra_emails
    WHEN p_credit_type = 'analysis' AND p_bucket = 'monthly' THEN analyses_remaining
    ELSE extra_analyses
  END
  INTO v_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- A concurrent request with the same key may have committed while this
  -- transaction waited for the balance lock. Re-check before mutating.
  SELECT * INTO v_existing
  FROM public.credit_ledger
  WHERE user_id = p_user_id
    AND idempotency_key = p_idempotency_key
    AND credit_type = p_credit_type
    AND bucket = p_bucket;
  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'already_processed', true,
      'amount', v_existing.amount,
      'balance', v_existing.balance_after
    );
  END IF;

  -- Reversals are recorded in full even after the pack was consumed. Extra
  -- balances can therefore become negative debt; a later pack/refund credit
  -- offsets that debt instead of recreating already-refunded value.
  v_actual := p_amount;
  v_new_balance := v_balance + v_actual;

  IF v_new_balance NOT BETWEEN -1000000 AND 1000000
    OR (p_bucket = 'monthly' AND v_new_balance < 0) THEN
    RAISE EXCEPTION 'CREDIT_BALANCE_OUT_OF_RANGE' USING ERRCODE = '22003';
  END IF;

  UPDATE public.user_credits
  SET emails_remaining = CASE
        WHEN p_credit_type = 'email' AND p_bucket = 'monthly' THEN v_new_balance
        ELSE emails_remaining END,
      extra_emails = CASE
        WHEN p_credit_type = 'email' AND p_bucket = 'extra' THEN v_new_balance
        ELSE extra_emails END,
      analyses_remaining = CASE
        WHEN p_credit_type = 'analysis' AND p_bucket = 'monthly' THEN v_new_balance
        ELSE analyses_remaining END,
      extra_analyses = CASE
        WHEN p_credit_type = 'analysis' AND p_bucket = 'extra' THEN v_new_balance
        ELSE extra_analyses END
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_ledger (
    user_id, credit_type, bucket, amount, balance_after, reason,
    idempotency_key, metadata
  ) VALUES (
    p_user_id, p_credit_type, p_bucket, v_actual, v_new_balance, p_reason,
    p_idempotency_key, COALESCE(p_metadata, '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'already_processed', false,
    'amount', v_actual,
    'balance', v_new_balance
  );
END;
$function$;

-- Reconciles Stripe state. A read/check call sets limits and can only clamp
-- balances on downgrade; monthly credits are replenished once per billing cycle.
CREATE OR REPLACE FUNCTION public.sync_subscription_state(
  p_user_id uuid,
  p_plan text,
  p_status text,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL,
  p_stripe_price_id text DEFAULT NULL,
  p_stripe_product_id text DEFAULT NULL,
  p_current_period_start timestamptz DEFAULT NULL,
  p_current_period_end timestamptz DEFAULT NULL,
  p_cancel_at_period_end boolean DEFAULT false,
  p_reset_cycle boolean DEFAULT false,
  p_source_event_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_plan public.subscription_plan;
  v_email_limit integer;
  v_analysis_limit integer;
  v_old_email integer;
  v_old_analysis integer;
  v_new_email integer;
  v_new_analysis integer;
  v_cycle_inserted boolean := false;
  v_cycle_rows bigint := 0;
  v_key text;
BEGIN
  IF p_plan NOT IN ('free', 'starter', 'pro', 'enterprise') THEN
    RAISE EXCEPTION 'INVALID_SUBSCRIPTION_PLAN' USING ERRCODE = '22023';
  END IF;

  v_plan := p_plan::public.subscription_plan;
  v_email_limit := CASE v_plan
    WHEN 'free' THEN 5 WHEN 'starter' THEN 50 WHEN 'pro' THEN 200 ELSE 1000000 END;
  v_analysis_limit := CASE v_plan
    WHEN 'free' THEN 1 WHEN 'starter' THEN 10 WHEN 'pro' THEN 50 ELSE 1000000 END;

  INSERT INTO public.billing_customers (
    user_id, stripe_customer_id, stripe_subscription_id, stripe_price_id,
    stripe_product_id, plan, status, current_period_start, current_period_end,
    cancel_at_period_end
  ) VALUES (
    p_user_id, p_stripe_customer_id, p_stripe_subscription_id, p_stripe_price_id,
    p_stripe_product_id, v_plan, COALESCE(p_status, 'inactive'),
    p_current_period_start, p_current_period_end, COALESCE(p_cancel_at_period_end, false)
  )
  ON CONFLICT (user_id) DO UPDATE SET
    stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, billing_customers.stripe_customer_id),
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    stripe_price_id = EXCLUDED.stripe_price_id,
    stripe_product_id = EXCLUDED.stripe_product_id,
    plan = EXCLUDED.plan,
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();

  UPDATE public.profiles
  SET plan = v_plan,
      plan_source = CASE WHEN v_plan = 'free' THEN 'free' ELSE 'stripe' END,
      plan_started_at = CASE WHEN plan IS DISTINCT FROM v_plan THEN now() ELSE plan_started_at END,
      trial_ends_at = CASE WHEN p_status = 'trialing' THEN p_current_period_end ELSE NULL END
  WHERE id = p_user_id;

  INSERT INTO public.user_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT emails_remaining, analyses_remaining
  INTO v_old_email, v_old_analysis
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF p_reset_cycle
    AND p_stripe_subscription_id IS NOT NULL
    AND p_current_period_start IS NOT NULL THEN
    INSERT INTO public.subscription_credit_cycles (
      user_id, stripe_subscription_id, period_start, period_end, plan, source_event_key
    ) VALUES (
      p_user_id, p_stripe_subscription_id, p_current_period_start,
      p_current_period_end, v_plan, COALESCE(p_source_event_key, 'stripe:cycle')
    )
    ON CONFLICT (stripe_subscription_id, period_start) DO NOTHING;
    GET DIAGNOSTICS v_cycle_rows = ROW_COUNT;
    v_cycle_inserted := v_cycle_rows > 0;
  END IF;

  IF v_cycle_inserted THEN
    v_new_email := v_email_limit;
    v_new_analysis := v_analysis_limit;
    v_key := 'subscription:cycle:' || p_stripe_subscription_id || ':' || extract(epoch FROM p_current_period_start)::bigint;
  ELSE
    -- Never replenish during subscription polling. A downgrade may only remove
    -- now-invalid monthly entitlement.
    v_new_email := LEAST(v_old_email, v_email_limit);
    v_new_analysis := LEAST(v_old_analysis, v_analysis_limit);
    v_key := 'subscription:state:' || p_user_id::text || ':' || v_plan::text || ':' ||
      COALESCE(extract(epoch FROM p_current_period_end)::bigint::text, 'none');
  END IF;

  UPDATE public.user_credits
  SET emails_monthly_limit = v_email_limit,
      analyses_monthly_limit = v_analysis_limit,
      emails_remaining = v_new_email,
      analyses_remaining = v_new_analysis,
      cycle_resets_at = p_current_period_end
  WHERE user_id = p_user_id;

  IF v_new_email <> v_old_email THEN
    INSERT INTO public.credit_ledger (
      user_id, credit_type, bucket, amount, balance_after, reason,
      idempotency_key, metadata
    ) VALUES (
      p_user_id, 'email', 'monthly', v_new_email - v_old_email, v_new_email,
      CASE WHEN v_cycle_inserted THEN 'subscription_cycle' ELSE 'subscription_adjustment' END,
      v_key,
      jsonb_build_object('plan', v_plan, 'status', p_status)
    ) ON CONFLICT DO NOTHING;
  END IF;

  IF v_new_analysis <> v_old_analysis THEN
    INSERT INTO public.credit_ledger (
      user_id, credit_type, bucket, amount, balance_after, reason,
      idempotency_key, metadata
    ) VALUES (
      p_user_id, 'analysis', 'monthly', v_new_analysis - v_old_analysis, v_new_analysis,
      CASE WHEN v_cycle_inserted THEN 'subscription_cycle' ELSE 'subscription_adjustment' END,
      v_key,
      jsonb_build_object('plan', v_plan, 'status', p_status)
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object(
    'plan', v_plan,
    'status', p_status,
    'cycle_reset_applied', v_cycle_inserted,
    'emails_remaining', v_new_email,
    'analyses_remaining', v_new_analysis
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.reserve_generation_credits(uuid, text, text, integer, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_api_rate_limit(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_generation_job_processing(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_generation_job(uuid, uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_generation_credits(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_stale_generation_jobs(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_credit_adjustment(uuid, text, text, integer, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_subscription_state(uuid, text, text, text, text, text, text, timestamptz, timestamptz, boolean, boolean, text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.reserve_generation_credits(uuid, text, text, integer, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.enforce_api_rate_limit(uuid, text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_generation_job_processing(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_generation_job(uuid, uuid, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_generation_credits(uuid, uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_stale_generation_jobs(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_credit_adjustment(uuid, text, text, integer, text, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_subscription_state(uuid, text, text, text, text, text, text, timestamptz, timestamptz, boolean, boolean, text) TO service_role;

-- -----------------------------------------------------------------------------
-- Complete, owner-scoped persistence for editor documents and funnels
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.email_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 160),
  subject text NOT NULL DEFAULT '' CHECK (char_length(subject) <= 300),
  preheader text NOT NULL DEFAULT '' CHECK (char_length(preheader) <= 500),
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (
    jsonb_typeof(blocks) = 'array' AND octet_length(blocks::text) <= 1000000
  ),
  rendered_html text NOT NULL DEFAULT '' CHECK (octet_length(rendered_html) <= 1000000),
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_documents_user_updated_idx
  ON public.email_documents (user_id, updated_at DESC);

ALTER TABLE public.email_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own email documents" ON public.email_documents;
DROP POLICY IF EXISTS "Users can create their own email documents" ON public.email_documents;
DROP POLICY IF EXISTS "Users can update their own email documents" ON public.email_documents;
DROP POLICY IF EXISTS "Users can delete their own email documents" ON public.email_documents;

CREATE POLICY "Users can view their own email documents"
  ON public.email_documents FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own email documents"
  ON public.email_documents FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email documents"
  ON public.email_documents FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email documents"
  ON public.email_documents FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

REVOKE ALL ON public.email_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_documents TO authenticated;

DROP TRIGGER IF EXISTS update_email_documents_updated_at ON public.email_documents;
CREATE TRIGGER update_email_documents_updated_at
  BEFORE UPDATE ON public.email_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add ownership FKs without rejecting any legacy rows during deployment. New
-- writes are enforced immediately; a later cleanup may VALIDATE the constraints.
DO $legacy_owner_fks$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_sequences_user_id_fkey_v2') THEN
    ALTER TABLE public.email_sequences
      ADD CONSTRAINT email_sequences_user_id_fkey_v2
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_blocks_user_id_fkey_v2') THEN
    ALTER TABLE public.email_blocks
      ADD CONSTRAINT email_blocks_user_id_fkey_v2
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_user_id_fkey_v2') THEN
    ALTER TABLE public.email_templates
      ADD CONSTRAINT email_templates_user_id_fkey_v2
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'brand_manuals_user_id_fkey_v2') THEN
    ALTER TABLE public.brand_manuals
      ADD CONSTRAINT brand_manuals_user_id_fkey_v2
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
  END IF;
END;
$legacy_owner_fks$;

ALTER TABLE public.email_sequences
  DROP CONSTRAINT IF EXISTS email_sequences_status_v2_check;
ALTER TABLE public.email_sequences
  ADD CONSTRAINT email_sequences_status_v2_check
  CHECK (status IN ('draft', 'active', 'archived')) NOT VALID;
ALTER TABLE public.sequence_emails
  DROP CONSTRAINT IF EXISTS sequence_emails_position_v2_check;
ALTER TABLE public.sequence_emails
  ADD CONSTRAINT sequence_emails_position_v2_check
  CHECK (position BETWEEN 1 AND 20) NOT VALID;
ALTER TABLE public.sequence_emails
  DROP CONSTRAINT IF EXISTS sequence_emails_delay_v2_check;
ALTER TABLE public.sequence_emails
  ADD CONSTRAINT sequence_emails_delay_v2_check
  CHECK (delay_days BETWEEN 0 AND 3650) NOT VALID;

-- Make ownership immutable on updates by requiring both old and new rows to be owned.
DROP POLICY IF EXISTS "Users can update their own sequences" ON public.email_sequences;
CREATE POLICY "Users can update their own sequences"
  ON public.email_sequences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update emails in their sequences" ON public.sequence_emails;
CREATE POLICY "Users can update emails in their sequences"
  ON public.sequence_emails FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.email_sequences
      WHERE email_sequences.id = sequence_emails.sequence_id
        AND email_sequences.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_sequences
      WHERE email_sequences.id = sequence_emails.sequence_id
        AND email_sequences.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.save_email_sequence(
  p_name text,
  p_description text,
  p_niche text,
  p_tone text,
  p_emails jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_sequence_id uuid;
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 160 THEN
    RAISE EXCEPTION 'INVALID_SEQUENCE_NAME' USING ERRCODE = '22023';
  END IF;
  IF char_length(COALESCE(p_description, '')) > 5000
    OR char_length(COALESCE(p_niche, '')) > 100
    OR char_length(COALESCE(p_tone, '')) > 100 THEN
    RAISE EXCEPTION 'SEQUENCE_METADATA_TOO_LARGE' USING ERRCODE = '22023';
  END IF;
  IF p_emails IS NULL OR jsonb_typeof(p_emails) <> 'array' THEN
    RAISE EXCEPTION 'INVALID_SEQUENCE_EMAILS' USING ERRCODE = '22023';
  END IF;

  v_count := jsonb_array_length(p_emails);
  IF v_count NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'SEQUENCE_EMAIL_COUNT_OUT_OF_RANGE' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_emails) AS item(value)
    WHERE jsonb_typeof(value) <> 'object'
      OR char_length(btrim(COALESCE(value ->> 'name', ''))) NOT BETWEEN 1 AND 160
      OR char_length(btrim(COALESCE(value ->> 'subject', ''))) NOT BETWEEN 1 AND 300
      OR char_length(COALESCE(value ->> 'preheader', '')) > 500
      OR char_length(btrim(COALESCE(value ->> 'content', ''))) NOT BETWEEN 1 AND 100000
      OR NOT CASE
        WHEN COALESCE(value ->> 'position', '') ~ '^[0-9]+$'
        THEN (value ->> 'position')::integer BETWEEN 1 AND 20
        ELSE false
      END
      OR NOT CASE
        WHEN COALESCE(value ->> 'delay_days', '0') ~ '^[0-9]+$'
        THEN COALESCE((value ->> 'delay_days')::integer, 0) BETWEEN 0 AND 3650
        ELSE false
      END
  ) THEN
    RAISE EXCEPTION 'INVALID_SEQUENCE_EMAIL' USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(DISTINCT (value ->> 'position')::integer)
    FROM jsonb_array_elements(p_emails) AS item(value)
  ) <> v_count THEN
    RAISE EXCEPTION 'DUPLICATE_SEQUENCE_POSITION' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.email_sequences (user_id, name, description, niche, tone, status)
  VALUES (
    v_user_id,
    btrim(p_name),
    nullif(btrim(COALESCE(p_description, '')), ''),
    nullif(btrim(COALESCE(p_niche, '')), ''),
    nullif(btrim(COALESCE(p_tone, '')), ''),
    'draft'
  )
  RETURNING id INTO v_sequence_id;

  INSERT INTO public.sequence_emails (
    sequence_id, position, name, subject, preheader, content, delay_days, trigger_type
  )
  SELECT
    v_sequence_id,
    (value ->> 'position')::integer,
    btrim(value ->> 'name'),
    btrim(value ->> 'subject'),
    nullif(value ->> 'preheader', ''),
    value ->> 'content',
    COALESCE((value ->> 'delay_days')::integer, 0),
    CASE
      WHEN COALESCE(value ->> 'trigger_type', 'time_delay') IN ('time_delay', 'event')
      THEN COALESCE(value ->> 'trigger_type', 'time_delay')
      ELSE 'time_delay'
    END
  FROM jsonb_array_elements(p_emails) AS item(value)
  ORDER BY (value ->> 'position')::integer;

  RETURN v_sequence_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_email_sequence(text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_email_sequence(text, text, text, text, jsonb) TO authenticated;

-- Funnel creation is only exposed through the atomic RPC; owners may still
-- edit or delete an already-created sequence under RLS.
REVOKE ALL ON public.email_sequences, public.sequence_emails FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.email_sequences TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.sequence_emails TO authenticated;

-- -----------------------------------------------------------------------------
-- Signup/referral audit compatibility
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  referral_code_param text;
  referrer_uuid uuid;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, plan_source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'free',
    'free'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  INSERT INTO public.user_credits (
    user_id, emails_remaining, emails_monthly_limit,
    analyses_remaining, analyses_monthly_limit
  ) VALUES (NEW.id, 5, 5, 1, 1);

  INSERT INTO public.credit_ledger (
    user_id, credit_type, bucket, amount, balance_after,
    reason, idempotency_key
  ) VALUES
    (NEW.id, 'email', 'monthly', 5, 5, 'signup_grant', 'signup:' || NEW.id::text),
    (NEW.id, 'analysis', 'monthly', 1, 1, 'signup_grant', 'signup:' || NEW.id::text);

  INSERT INTO public.referrals (referrer_id, referral_code, status)
  VALUES (NEW.id, 'REF-' || upper(substring(NEW.id::text, 1, 8)), 'active');

  referral_code_param := NEW.raw_user_meta_data ->> 'referral_code';
  IF referral_code_param IS NOT NULL THEN
    SELECT referrer_id INTO referrer_uuid
    FROM public.referrals
    WHERE referral_code = referral_code_param
      AND status = 'active'
      AND referrer_id <> NEW.id;

    IF referrer_uuid IS NOT NULL THEN
      UPDATE public.referrals
      SET referred_id = COALESCE(referred_id, NEW.id),
          converted_at = COALESCE(converted_at, now()),
          emails_rewarded = emails_rewarded + 2
      WHERE referral_code = referral_code_param;

      PERFORM public.apply_credit_adjustment(
        referrer_uuid,
        'email',
        'extra',
        2,
        'referral',
        'referral:' || NEW.id::text,
        jsonb_build_object('referred_user_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Keep updated_at consistent on all new mutable backend tables.
DROP TRIGGER IF EXISTS update_generation_jobs_updated_at ON public.generation_jobs;
CREATE TRIGGER update_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_billing_customers_updated_at ON public.billing_customers;
CREATE TRIGGER update_billing_customers_updated_at
  BEFORE UPDATE ON public.billing_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_stripe_events_updated_at ON public.stripe_events;
CREATE TRIGGER update_stripe_events_updated_at
  BEFORE UPDATE ON public.stripe_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
