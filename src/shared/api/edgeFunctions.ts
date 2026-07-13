import { supabase } from "@/integrations/supabase/client";

export class EdgeFunctionError extends Error {
  constructor(
    message: string,
    public readonly code = "EDGE_FUNCTION_ERROR",
  ) {
    super(message);
    this.name = "EdgeFunctionError";
  }
}

export async function invokeEdgeFunction<TRequest, TResponse>(
  name: string,
  body: TRequest,
  idempotencyKey: string = crypto.randomUUID(),
): Promise<TResponse> {
  const { data, error } = await supabase.functions.invoke(name, {
    body: body as Record<string, unknown>,
    headers: { "Idempotency-Key": idempotencyKey },
  });

  if (error) {
    throw new EdgeFunctionError(
      error.message || "O serviço não conseguiu concluir a solicitação",
      name,
    );
  }

  return data as TResponse;
}
