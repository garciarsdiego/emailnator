import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireUser } from "../_shared/auth.ts";
import { appOrigin, preflight } from "../_shared/cors.ts";
import { AppError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse, readJson, requestId } from "../_shared/http.ts";
import { logInfo } from "../_shared/logger.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { stripeClient } from "../_shared/stripe-client.ts";

serve(async (req) => {
  const optionsResponse = preflight(req);
  if (optionsResponse) return optionsResponse;
  const traceId = requestId(req);
  try {
    const auth = await requireUser(req);
    await enforceRateLimit({
      serviceClient: auth.serviceClient,
      userId: auth.user.id,
      action: "customer_portal",
      maxRequests: 10,
      windowSeconds: 600,
    });
    await readJson(req);
    const { data, error } = await auth.serviceClient
      .from("billing_customers")
      .select("stripe_customer_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (error) throw new AppError("BILLING_LOOKUP_FAILED", 500, "Unable to load billing account", false);
    const customerId = data?.stripe_customer_id as string | null | undefined;
    if (!customerId) {
      throw new AppError("STRIPE_CUSTOMER_NOT_FOUND", 404, "Nenhuma conta de cobrança foi encontrada");
    }

    const session = await stripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appOrigin(req)}/pricing`,
    });
    logInfo("customer_portal_created", { requestId: traceId, userId: auth.user.id, sessionId: session.id });
    return jsonResponse(req, { url: session.url });
  } catch (error) {
    return errorResponse(req, error, traceId);
  }
});
