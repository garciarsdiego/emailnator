import Stripe from "https://esm.sh/stripe@18.5.0";
import { AppError } from "./errors.ts";

export function stripeClient(): Stripe {
  const secret = Deno.env.get("STRIPE_SECRET_KEY")?.trim();
  if (!secret) throw new AppError("STRIPE_NOT_CONFIGURED", 503, "Billing is not configured", false);
  return new Stripe(secret, {
    apiVersion: "2025-08-27.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
}
