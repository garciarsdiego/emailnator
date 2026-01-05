-- =====================================================
-- FASE 1: CORREÇÕES DE SEGURANÇA CRÍTICAS (P0)
-- =====================================================

-- 1.1 Funções atômicas para consumo de créditos (evita race condition)
-- =====================================================

-- Função para consumir crédito de email atomicamente
CREATE OR REPLACE FUNCTION public.consume_email_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extra_emails INTEGER;
  v_emails_remaining INTEGER;
  v_rows_affected INTEGER;
BEGIN
  -- Lock da linha para evitar race condition
  SELECT extra_emails, emails_remaining 
  INTO v_extra_emails, v_emails_remaining
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se há créditos disponíveis
  IF v_extra_emails <= 0 AND v_emails_remaining <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Primeiro usa extra, depois monthly
  IF v_extra_emails > 0 THEN
    UPDATE user_credits
    SET extra_emails = extra_emails - 1,
        updated_at = now()
    WHERE user_id = p_user_id AND extra_emails > 0;
  ELSE
    UPDATE user_credits
    SET emails_remaining = emails_remaining - 1,
        updated_at = now()
    WHERE user_id = p_user_id AND emails_remaining > 0;
  END IF;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;

-- Função para consumir crédito de análise atomicamente
CREATE OR REPLACE FUNCTION public.consume_analysis_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_extra_analyses INTEGER;
  v_analyses_remaining INTEGER;
  v_rows_affected INTEGER;
BEGIN
  -- Lock da linha para evitar race condition
  SELECT extra_analyses, analyses_remaining 
  INTO v_extra_analyses, v_analyses_remaining
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se há créditos disponíveis
  IF v_extra_analyses <= 0 AND v_analyses_remaining <= 0 THEN
    RETURN FALSE;
  END IF;
  
  -- Primeiro usa extra, depois monthly
  IF v_extra_analyses > 0 THEN
    UPDATE user_credits
    SET extra_analyses = extra_analyses - 1,
        updated_at = now()
    WHERE user_id = p_user_id AND extra_analyses > 0;
  ELSE
    UPDATE user_credits
    SET analyses_remaining = analyses_remaining - 1,
        updated_at = now()
    WHERE user_id = p_user_id AND analyses_remaining > 0;
  END IF;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  RETURN v_rows_affected > 0;
END;
$$;

-- =====================================================
-- 2.2 Atualizar handle_new_user com validações
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral_code_param TEXT;
  referrer_uuid UUID;
  safe_full_name TEXT;
BEGIN
  -- Validar e sanitizar full_name (máximo 255 caracteres)
  safe_full_name := SUBSTRING(
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), 
    1, 255
  );
  
  -- Criar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, safe_full_name);

  -- Criar role padrão
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  -- Criar créditos iniciais (Free plan)
  INSERT INTO public.user_credits (user_id, emails_remaining, emails_monthly_limit, analyses_remaining, analyses_monthly_limit)
  VALUES (NEW.id, 5, 5, 1, 1);

  -- Gerar código de referência único
  INSERT INTO public.referrals (referrer_id, referral_code, status)
  VALUES (NEW.id, 'REF-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8)), 'active');

  -- Validar formato do código de referência antes de processar
  referral_code_param := NEW.raw_user_meta_data ->> 'referral_code';
  IF referral_code_param IS NOT NULL THEN
    -- Validar formato: REF-XXXXXXXX (8 caracteres alfanuméricos maiúsculos)
    IF referral_code_param ~ '^REF-[A-Z0-9]{8}$' THEN
      -- Encontrar o referrer
      SELECT referrer_id INTO referrer_uuid
      FROM public.referrals
      WHERE referral_code = referral_code_param AND status = 'active';

      -- Verificar que o referrer não é o próprio usuário
      IF referrer_uuid IS NOT NULL AND referrer_uuid != NEW.id THEN
        -- Marcar referral como convertido
        UPDATE public.referrals
        SET referred_id = NEW.id,
            status = 'converted',
            converted_at = now(),
            emails_rewarded = emails_rewarded + 2
        WHERE referral_code = referral_code_param;

        -- Dar bônus ao referrer
        UPDATE public.user_credits
        SET extra_emails = extra_emails + 2
        WHERE user_id = referrer_uuid;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;