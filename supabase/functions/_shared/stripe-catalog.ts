import { AppError } from "./errors.ts";
import { objectValue, optionalString } from "./validation.ts";

export type CheckoutMode = "subscription" | "payment";
export type Plan = "free" | "starter" | "pro" | "enterprise";

export interface CatalogItem {
  key: string;
  priceId: string;
  productId: string;
  mode: CheckoutMode;
  plan?: Plan;
  emailCredits?: number;
}

function env(name: string, fallback: string): string {
  return Deno.env.get(name)?.trim() || fallback;
}

export function stripeCatalog(): CatalogItem[] {
  return [
    {
      key: "starter",
      priceId: env("STRIPE_STARTER_PRICE_ID", "price_1ShwSxHTsSYecV8PE48lPEwy"),
      productId: env("STRIPE_STARTER_PRODUCT_ID", "prod_TfH04UvgnZuws9"),
      mode: "subscription",
      plan: "starter",
    },
    {
      key: "pro",
      priceId: env("STRIPE_PRO_PRICE_ID", "price_1ShwTPHTsSYecV8P0oAO8yda"),
      productId: env("STRIPE_PRO_PRODUCT_ID", "prod_TfH1mpMYkhsVIh"),
      mode: "subscription",
      plan: "pro",
    },
    {
      key: "pack10",
      priceId: env("STRIPE_PACK10_PRICE_ID", "price_1ShwTaHTsSYecV8PPszKUHch"),
      productId: env("STRIPE_PACK10_PRODUCT_ID", "prod_TfH1UKOWKDNtMZ"),
      mode: "payment",
      emailCredits: 10,
    },
    {
      key: "pack50",
      priceId: env("STRIPE_PACK50_PRICE_ID", "price_1ShwU4HTsSYecV8PR1sLJd1r"),
      productId: env("STRIPE_PACK50_PRODUCT_ID", "prod_TfH28479xLf7eu"),
      mode: "payment",
      emailCredits: 50,
    },
    {
      key: "pack150",
      priceId: env("STRIPE_PACK150_PRICE_ID", "price_1ShwWzHTsSYecV8P80g3tyXz"),
      productId: env("STRIPE_PACK150_PRODUCT_ID", "prod_TfH5rOgnEi9IFa"),
      mode: "payment",
      emailCredits: 150,
    },
  ];
}

export function checkoutItem(value: unknown): CatalogItem {
  const body = objectValue(value);
  const productKey = optionalString(body, "productKey", 100);
  const priceId = optionalString(body, "priceId", 200);
  const requestedMode = optionalString(body, "mode", 30);
  const item = stripeCatalog().find((entry) =>
    (productKey && entry.key === productKey) || (priceId && entry.priceId === priceId)
  );
  if (!item) {
    throw new AppError("CHECKOUT_PRODUCT_NOT_ALLOWED", 400, "The selected product is not available");
  }
  if (requestedMode && requestedMode !== item.mode) {
    throw new AppError("CHECKOUT_MODE_MISMATCH", 400, "The checkout mode does not match the selected product");
  }
  return item;
}

export function catalogItemForPrice(priceId?: string | null, productId?: string | null): CatalogItem | undefined {
  return stripeCatalog().find((entry) =>
    (priceId && entry.priceId === priceId) || (productId && entry.productId === productId)
  );
}

export function activeSubscriptionStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}
