import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Product ID to plan mapping
const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_TfH04UvgnZuws9": "starter",
  "prod_TfH1mpMYkhsVIh": "pro",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan: "free",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    // Also check for trialing subscriptions
    const trialingSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    const allSubscriptions = [...subscriptions.data, ...trialingSubscriptions.data];
    const hasActiveSub = allSubscriptions.length > 0;

    let plan = "free";
    let subscriptionEnd = null;
    let isTrialing = false;

    if (hasActiveSub) {
      const subscription = allSubscriptions[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      isTrialing = subscription.status === "trialing";
      
      const productId = subscription.items.data[0].price.product as string;
      plan = PRODUCT_TO_PLAN[productId] || "free";
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        plan,
        isTrialing,
        endDate: subscriptionEnd 
      });

      // Update profile plan in database
      const planStartedAt = subscription.start_date 
        ? new Date(subscription.start_date * 1000).toISOString() 
        : new Date().toISOString();
      
      const trialEndsAt = isTrialing && subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null;

      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({ 
          plan: plan as "free" | "starter" | "pro" | "enterprise",
          plan_started_at: planStartedAt,
          trial_ends_at: trialEndsAt,
        })
        .eq("id", user.id);

      if (updateError) {
        logStep("Error updating profile", { error: updateError.message });
      }

      // Update credits based on plan
      const creditsConfig = {
        starter: { emails: 50, analyses: 10 },
        pro: { emails: 200, analyses: 50 },
      };

      const credits = creditsConfig[plan as keyof typeof creditsConfig];
      if (credits) {
        const { error: creditsError } = await supabaseClient
          .from("user_credits")
          .update({
            emails_monthly_limit: credits.emails,
            analyses_monthly_limit: credits.analyses,
            emails_remaining: credits.emails,
            analyses_remaining: credits.analyses,
          })
          .eq("user_id", user.id);

        if (creditsError) {
          logStep("Error updating credits", { error: creditsError.message });
        }
      }
    } else {
      logStep("No active subscription found");
      
      // Reset to free plan
      await supabaseClient
        .from("profiles")
        .update({ plan: "free", trial_ends_at: null })
        .eq("id", user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan,
      subscription_end: subscriptionEnd,
      is_trialing: isTrialing,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
