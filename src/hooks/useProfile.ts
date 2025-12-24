import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: "free" | "starter" | "pro" | "enterprise";
  plan_started_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: string;
  emails_rewarded: number;
  analyses_rewarded: number;
  created_at: string;
  converted_at: string | null;
}

export function useProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    },
    enabled: !!user,
  });

  const { data: referral, isLoading: referralLoading } = useQuery({
    queryKey: ["referral", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) throw error;
      return data as Referral | null;
    },
    enabled: !!user,
  });

  return {
    profile,
    referral,
    isLoading: profileLoading || referralLoading,
    referralCode: referral?.referral_code,
  };
}
