import { z } from "zod";
import { invokeEdgeFunction } from "@/shared/api/edgeFunctions";

// z.string().url() alone accepts any parseable URL (including javascript:).
// These URLs are handed to window.open/location.assign, so restrict to https.
const httpsUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), {
    message: "URL de redirecionamento inválida",
  });

const checkoutResponseSchema = z.object({
  url: httpsUrlSchema,
  sessionId: z.string().min(1),
});

const portalResponseSchema = z.object({ url: httpsUrlSchema });

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
