import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const consumeEmailCredit = useMutation({
    mutationFn: async () => {
      if (!user || !credits) throw new Error("No credits available");

      // First use extra credits, then monthly credits
      const useExtra = credits.extra_emails > 0;
      
      const { error } = await supabase
        .from("user_credits")
        .update(
          useExtra
            ? { extra_emails: credits.extra_emails - 1 }
            : { emails_remaining: credits.emails_remaining - 1 }
        )
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-credits", user?.id] });
    },
  });

  const consumeAnalysisCredit = useMutation({
    mutationFn: async () => {
      if (!user || !credits) throw new Error("No credits available");

      const useExtra = credits.extra_analyses > 0;
      
      const { error } = await supabase
        .from("user_credits")
        .update(
          useExtra
            ? { extra_analyses: credits.extra_analyses - 1 }
            : { analyses_remaining: credits.analyses_remaining - 1 }
        )
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-credits", user?.id] });
    },
  });

  const totalEmails = (credits?.emails_remaining ?? 0) + (credits?.extra_emails ?? 0);
  const totalAnalyses = (credits?.analyses_remaining ?? 0) + (credits?.extra_analyses ?? 0);

  return {
    credits,
    isLoading,
    error,
    totalEmails,
    totalAnalyses,
    hasEmailCredits: totalEmails > 0,
    hasAnalysisCredits: totalAnalyses > 0,
    consumeEmailCredit,
    consumeAnalysisCredit,
  };
}
