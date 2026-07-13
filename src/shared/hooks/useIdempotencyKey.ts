import { useCallback, useRef } from "react";

interface Attempt {
  signature: string;
  key: string;
}

export function useIdempotencyKey() {
  const attemptRef = useRef<Attempt | null>(null);

  const getKey = useCallback((payload: unknown) => {
    const signature = JSON.stringify(payload);
    if (!attemptRef.current || attemptRef.current.signature !== signature) {
      attemptRef.current = { signature, key: crypto.randomUUID() };
    }
    return attemptRef.current.key;
  }, []);

  const complete = useCallback(() => {
    attemptRef.current = null;
  }, []);

  return { getKey, complete };
}
