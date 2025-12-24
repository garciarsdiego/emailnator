// Stripe Product and Price IDs
export const STRIPE_PLANS = {
  starter: {
    productId: "prod_TfH04UvgnZuws9",
    priceId: "price_1ShwSxHTsSYecV8PE48lPEwy",
    name: "Starter",
    price: 49,
  },
  pro: {
    productId: "prod_TfH1mpMYkhsVIh",
    priceId: "price_1ShwTPHTsSYecV8P0oAO8yda",
    name: "Pro",
    price: 149,
  },
} as const;

export const STRIPE_CREDIT_PACKS = {
  pack10: {
    productId: "prod_TfH1UKOWKDNtMZ",
    priceId: "price_1ShwTaHTsSYecV8PPszKUHch",
    emails: 10,
    price: 19,
  },
  pack50: {
    productId: "prod_TfH28479xLf7eu",
    priceId: "price_1ShwU4HTsSYecV8PR1sLJd1r",
    emails: 50,
    price: 79,
  },
  pack150: {
    productId: "prod_TfH5rOgnEi9IFa",
    priceId: "price_1ShwWzHTsSYecV8P80g3tyXz",
    emails: 150,
    price: 199,
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;
export type StripeCreditPackKey = keyof typeof STRIPE_CREDIT_PACKS;
