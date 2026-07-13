import { z } from "zod";
import { invokeEdgeFunction } from "@/shared/api/edgeFunctions";

const checkoutResponseSchema = z.object({
  url: z.string().url(),
  sessionId: z.string().min(1),
});

const portalResponseSchema = z.object({ url: z.string().url() });

export async function createCheckout(productKey: string, idempotencyKey?: string): Promise<string> {
  const data = await invokeEdgeFunction<{ productKey: string }, unknown>(
    "create-checkout",
    { productKey },
    idempotencyKey,
  );
  return checkoutResponseSchema.parse(data).url;
}

export async function createCustomerPortal(): Promise<string> {
  const data = await invokeEdgeFunction<Record<string, never>, unknown>("customer-portal", {});
  return portalResponseSchema.parse(data).url;
}
