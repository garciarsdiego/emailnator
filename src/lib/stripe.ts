export const STRIPE_PLANS = {
  starter: {
    name: "Starter",
    price: 49,
  },
  pro: {
    name: "Pro",
    price: 149,
  },
} as const;

export const STRIPE_CREDIT_PACKS = {
  pack10: {
    emails: 10,
    price: 19,
  },
  pack50: {
    emails: 50,
    price: 79,
  },
  pack150: {
    emails: 150,
    price: 199,
  },
} as const;
