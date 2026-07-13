import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { AppError } from "./errors.ts";

export function stripeObjectId(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

function validUserId(value: unknown): string | null {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export async function userForStripeCustomer(
  serviceClient: SupabaseClient,
  customerId: string | null,
  metadataUserId?: unknown,
): Promise<string> {
  const metadataId = validUserId(metadataUserId);
  if (customerId) {
    const { data, error } = await serviceClient
      .from("billing_customers")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (error) {
      throw new AppError("WEBHOOK_USER_LOOKUP_FAILED", 500, "Unable to inspect the Stripe customer mapping", false);
    }
    if (data?.user_id) {
      if (metadataId && data.user_id !== metadataId) {
        throw new AppError("WEBHOOK_IDENTITY_MISMATCH", 500, "Stripe metadata conflicts with the customer mapping", false);
      }
      return data.user_id as string;
    }
  }
  if (metadataId) {
    const { data, error } = await serviceClient
      .from("profiles")
      .select("id")
      .eq("id", metadataId)
      .maybeSingle();
    if (error) {
      throw new AppError("WEBHOOK_USER_LOOKUP_FAILED", 500, "Unable to inspect the Stripe user metadata", false);
    }
    if (data?.id) return data.id;
  }
  throw new AppError("WEBHOOK_USER_NOT_FOUND", 500, "Unable to map Stripe event to a user", false);
}

export async function saveStripeCustomerMapping(
  serviceClient: SupabaseClient,
  userId: string,
  customerId: string | null,
): Promise<void> {
  if (!customerId) return;
  const { data: owner, error: lookupError } = await serviceClient
    .from("billing_customers")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (lookupError) {
    throw new AppError("BILLING_MAPPING_FAILED", 500, "Unable to verify the Stripe customer mapping", false);
  }
  if (owner?.user_id && owner.user_id !== userId) {
    throw new AppError("WEBHOOK_IDENTITY_MISMATCH", 500, "Stripe customer is already mapped to another user", false);
  }
  const { error } = await serviceClient.from("billing_customers").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
  }, { onConflict: "user_id" });
  if (error) throw new AppError("BILLING_MAPPING_FAILED", 500, "Unable to save Stripe customer mapping", false);
}
