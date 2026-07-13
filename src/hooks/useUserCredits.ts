import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserCredits {
  id: string;
  user_id: string;
  emails_remaining: number;
  emails_monthly_limit: number;
  analyses_remaining: number;
  analyses_monthly_limit: number;
  extra_emails: number;
  extra_analyses: number;
  credits_expire_at: string | null;
  cycle_resets_at: string | null;
}

export function useUserCredits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: credits, isLoading, error } = useQuery({
    queryKey: ["user-credits", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserCredits | null;
    },
    enabled: !!user,
  });

  const refreshCredits = () =>
    queryClient.invalidateQueries({ queryKey: ["user-credits", user?.id] });

  const totalEmails = Math.max(
    0,
    (credits?.emails_remaining ?? 0) + (credits?.extra_emails ?? 0),
  );
  const totalAnalyses = Math.max(
    0,
    (credits?.analyses_remaining ?? 0) + (credits?.extra_analyses ?? 0),
  );

  return {
    credits,
    isLoading,
    error,
    totalEmails,
    totalAnalyses,
    hasEmailCredits: totalEmails > 0,
    hasAnalysisCredits: totalAnalyses > 0,
    refreshCredits,
  };
}
