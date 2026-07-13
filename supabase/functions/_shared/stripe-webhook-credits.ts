import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import { AppError } from "./errors.ts";
import { catalogItemForPrice } from "./stripe-catalog.ts";
import { stripeObjectId, userForStripeCustomer } from "./stripe-webhook-users.ts";

export async function applyPurchasedPack(
  serviceClient: SupabaseClient,
  userId: string,
  priceId: string | undefined,
  event: Stripe.Event,
): Promise<void> {
  const item = catalogItemForPrice(priceId);
  if (!item || item.mode !== "payment" || !item.emailCredits) {
    throw new AppError("WEBHOOK_CATALOG_MISMATCH", 500, "Paid checkout is not in the server catalog", false);
  }
  const { error } = await serviceClient.rpc("apply_credit_adjustment", {
    p_user_id: userId,
    p_credit_type: "email",
    p_bucket: "extra",
    p_amount: item.emailCredits,
    p_reason: "purchase",
    p_idempotency_key: `stripe:${event.id}:pack`,
    p_metadata: { event_id: event.id, catalog_key: item.key, price_id: item.priceId },
  });
  if (error) throw new AppError("CREDIT_PACK_GRANT_FAILED", 500, "Unable to grant purchased credits", false);
}

export async function reversePurchasedPack(options: {
  serviceClient: SupabaseClient;
  stripe: Stripe;
  event: Stripe.Event;
  paymentIntentId: string;
  reversalAmount: number;
  reason: "purchase_refund" | "chargeback";
  stripeObjectId: string;
}): Promise<void> {
  const intent = await options.stripe.paymentIntents.retrieve(options.paymentIntentId);
  const metadata = intent.metadata;
  const userId = await userForStripeCustomer(
    options.serviceClient,
    stripeObjectId(intent.customer),
    metadata.user_id,
  );
  const item = catalogItemForPrice(metadata.price_id);
  if (!item?.emailCredits || item.mode !== "payment") return;
  const paidAmount = intent.amount_received || intent.amount;
  const ratio = paidAmount > 0 ? Math.min(1, options.reversalAmount / paidAmount) : 1;
  const credits = Math.max(1, Math.min(item.emailCredits, Math.round(item.emailCredits * ratio)));
  const { error } = await options.serviceClient.rpc("apply_credit_adjustment", {
    p_user_id: userId,
    p_credit_type: "email",
    p_bucket: "extra",
    p_amount: -credits,
    p_reason: options.reason,
    p_idempotency_key: `stripe:${options.reason}:${options.stripeObjectId}:debit`,
    p_metadata: {
      event_id: options.event.id,
      payment_intent_id: intent.id,
      requested_reversal: credits,
      stripe_object_id: options.stripeObjectId,
    },
  });
  if (error) throw new AppError("CREDIT_PACK_REVERSAL_FAILED", 500, "Unable to reverse purchased credits", false);
}

export async function restoreReversedPack(options: {
  serviceClient: SupabaseClient;
  stripe: Stripe;
  event: Stripe.Event;
  paymentIntentId: string;
  debitReason: "purchase_refund" | "chargeback";
  creditReason: "purchase_refund_reversal" | "chargeback_reversal";
  stripeObjectId: string;
}): Promise<void> {
  const intent = await options.stripe.paymentIntents.retrieve(options.paymentIntentId);
  const userId = await userForStripeCustomer(
    options.serviceClient,
    stripeObjectId(intent.customer),
    intent.metadata.user_id,
  );
  const { data: debit, error: lookupError } = await options.serviceClient
    .from("credit_ledger")
    .select("amount")
    .eq("user_id", userId)
    .eq("reason", options.debitReason)
    .eq("metadata->>stripe_object_id", options.stripeObjectId)
    .maybeSingle();
  if (lookupError) {
    throw new AppError("CREDIT_REVERSAL_LOOKUP_FAILED", 500, "Unable to inspect reversed credits", false);
  }
  const amount = typeof debit?.amount === "number" ? Math.abs(debit.amount) : 0;
  if (!amount) return;
  const { error } = await options.serviceClient.rpc("apply_credit_adjustment", {
    p_user_id: userId,
    p_credit_type: "email",
    p_bucket: "extra",
    p_amount: amount,
    p_reason: options.creditReason,
    p_idempotency_key: `stripe:${options.creditReason}:${options.stripeObjectId}:credit`,
    p_metadata: {
      event_id: options.event.id,
      payment_intent_id: intent.id,
      stripe_object_id: options.stripeObjectId,
    },
  });
  if (error) throw new AppError("CREDIT_PACK_RESTORE_FAILED", 500, "Unable to restore reversed credits", false);
}
