import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/shared/api/edgeFunctions";
import {
  FREE_SUBSCRIPTION,
  normalizeSubscription,
  type SubscriptionInfo,
} from "@/features/billing/model/subscription";

export async function fetchSubscription(): Promise<SubscriptionInfo> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.access_token) return FREE_SUBSCRIPTION;

  const data = await invokeEdgeFunction<Record<string, never>, unknown>("check-subscription", {});
  return normalizeSubscription(data);
}
