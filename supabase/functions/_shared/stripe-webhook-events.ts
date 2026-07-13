import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import { AppError } from "./errors.ts";
import {
  applyPurchasedPack,
  restoreReversedPack,
  reversePurchasedPack,
} from "./stripe-webhook-credits.ts";
import {
  saveStripeCustomerMapping,
  stripeObjectId,
  userForStripeCustomer,
} from "./stripe-webhook-users.ts";
import { activeSubscriptionStatus } from "./stripe-catalog.ts";
import { syncFreeAccount, syncSubscription } from "./subscriptions.ts";

type StripeObject = Record<string, unknown> & { id?: string; metadata?: Record<string, string> };

function invoiceSubscriptionId(invoice: StripeObject): string | null {
  const direct = stripeObjectId(invoice.subscription);
  if (direct) return direct;
  const parent = invoice.parent as Record<string, unknown> | undefined;
  const details = parent?.subscription_details as Record<string, unknown> | undefined;
  return stripeObjectId(details?.subscription);
}

async function processCheckout(
  event: Stripe.Event,
  serviceClient: SupabaseClient,
  stripe: Stripe,
  object: StripeObject,
): Promise<void> {
  const session = object as unknown as Stripe.Checkout.Session;
  const customerId = stripeObjectId(session.customer);
  const userId = await userForStripeCustomer(
    serviceClient,
    customerId,
    session.metadata?.user_id ?? session.client_reference_id,
  );
  await saveStripeCustomerMapping(serviceClient, userId, customerId);

  if (session.mode === "payment") {
    if (session.payment_status === "paid") {
      await applyPurchasedPack(serviceClient, userId, session.metadata?.price_id, event);
    }
    return;
  }
  const subscriptionId = stripeObjectId(session.subscription);
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    await syncSubscription({ serviceClient, userId, subscription, resetCycle: false, sourceEventKey: event.id });
  }
}

async function processSubscription(
  event: Stripe.Event,
  serviceClient: SupabaseClient,
  stripe: Stripe,
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId = stripeObjectId(subscription.customer);
  const userId = await userForStripeCustomer(serviceClient, customerId, subscription.metadata?.user_id);
  await saveStripeCustomerMapping(serviceClient, userId, customerId);
  if (!customerId) {
    throw new AppError("STRIPE_STATE_INVALID", 500, "Stripe subscription is missing its customer", false);
  }

  // Stripe can deliver subscription events out of order. Reconcile against the
  // customer's current subscriptions instead of trusting a stale event
  // snapshot, and never let deletion of an old subscription downgrade a newer
  // active one.
  const listed = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
  const active = listed.data
    .filter((entry: Stripe.Subscription) =>
      activeSubscriptionStatus(entry.status)
      && (!entry.metadata?.user_id || entry.metadata.user_id === userId)
    )
    .sort((left: Stripe.Subscription, right: Stripe.Subscription) => right.created - left.created)[0];

  if (!active) {
    await syncFreeAccount({
      serviceClient,
      userId,
      customerId,
      status: subscription.status || "inactive",
      sourceEventKey: event.id,
    });
    return;
  }
  await syncSubscription({
    serviceClient,
    userId,
    subscription: active,
    resetCycle: event.type === "customer.subscription.created"
      && active.id === subscription.id
      && active.status === "trialing",
    sourceEventKey: event.id,
  });
}

export async function processStripeEvent(
  event: Stripe.Event,
  serviceClient: SupabaseClient,
  stripe: Stripe,
): Promise<boolean> {
  const object = event.data.object as unknown as StripeObject;

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await processCheckout(event, serviceClient, stripe, object);
    return true;
  }
  if ([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ].includes(event.type)) {
    await processSubscription(event, serviceClient, stripe, object as unknown as Stripe.Subscription);
    return true;
  }
  if (["invoice.paid", "invoice.payment_failed"].includes(event.type)) {
    const subscriptionId = invoiceSubscriptionId(object);
    if (!subscriptionId) return true;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    const customerId = stripeObjectId(subscription.customer);
    const userId = await userForStripeCustomer(serviceClient, customerId, subscription.metadata?.user_id);
    await syncSubscription({
      serviceClient,
      userId,
      subscription,
      resetCycle: event.type === "invoice.paid",
      sourceEventKey: event.id,
    });
    return true;
  }
  if (event.type === "refund.created") {
    const refund = object as unknown as Stripe.Refund;
    const paymentIntentId = stripeObjectId(refund.payment_intent);
    if (paymentIntentId) {
      await reversePurchasedPack({
        serviceClient,
        stripe,
        event,
        paymentIntentId,
        reversalAmount: refund.amount,
        reason: "purchase_refund",
        stripeObjectId: refund.id,
      });
    }
    return true;
  }
  if (event.type === "refund.failed") {
    const refund = object as unknown as Stripe.Refund;
    const paymentIntentId = stripeObjectId(refund.payment_intent);
    if (paymentIntentId) {
      await restoreReversedPack({
        serviceClient,
        stripe,
        event,
        paymentIntentId,
        debitReason: "purchase_refund",
        creditReason: "purchase_refund_reversal",
        stripeObjectId: refund.id,
      });
    }
    return true;
  }
  if (event.type === "charge.dispute.created") {
    const dispute = object as unknown as Stripe.Dispute;
    const chargeId = stripeObjectId(dispute.charge);
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId) as Stripe.Charge;
      const paymentIntentId = stripeObjectId(charge.payment_intent);
      if (paymentIntentId) {
        await reversePurchasedPack({
          serviceClient,
          stripe,
          event,
          paymentIntentId,
          reversalAmount: dispute.amount,
          reason: "chargeback",
          stripeObjectId: dispute.id,
        });
      }
    }
    return true;
  }
  if (event.type === "charge.dispute.closed") {
    const dispute = object as unknown as Stripe.Dispute;
    if (dispute.status !== "won") return true;
    const chargeId = stripeObjectId(dispute.charge);
    if (chargeId) {
      const charge = await stripe.charges.retrieve(chargeId) as Stripe.Charge;
      const paymentIntentId = stripeObjectId(charge.payment_intent);
      if (paymentIntentId) {
        await restoreReversedPack({
          serviceClient,
          stripe,
          event,
          paymentIntentId,
          debitReason: "chargeback",
          creditReason: "chargeback_reversal",
          stripeObjectId: dispute.id,
        });
      }
    }
    return true;
  }
  if (event.type === "customer.deleted") {
    const customerId = object.id ?? null;
    const userId = await userForStripeCustomer(serviceClient, customerId, object.metadata?.user_id);
    await syncFreeAccount({
      serviceClient,
      userId,
      customerId,
      status: "customer_deleted",
      sourceEventKey: event.id,
    });
    return true;
  }
  return false;
}
