import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CampaignVariations {
  subjects?: string[];
  subjectsResend?: string[];
  preheaders?: string[];
  ctas?: string[];
  tips?: string[];
}

export interface Campaign {
  id: string;
  user_id: string;
  niche: string;
  site_url: string | null;
  campaign_type: string;
  subject: string;
  content: string;
  tone: string | null;
  target_audience: string | null;
  site_analysis: Record<string, unknown> | null;
  variations: CampaignVariations | null;
  created_at: string;
}

interface CreateCampaignData {
  niche: string;
  site_url?: string;
  campaign_type: string;
  subject: string;
  content: string;
  tone?: string;
  target_audience?: string;
  site_analysis?: Record<string, unknown>;
  variations?: CampaignVariations;
}

export function useCampaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!user,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaignData: CreateCampaignData) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("campaigns")
        .insert([{
          user_id: user.id,
          niche: campaignData.niche,
          campaign_type: campaignData.campaign_type,
          subject: campaignData.subject,
          content: campaignData.content,
          tone: campaignData.tone,
          target_audience: campaignData.target_audience,
          site_url: campaignData.site_url,
          site_analysis: campaignData.site_analysis ? JSON.parse(JSON.stringify(campaignData.site_analysis)) : null,
          variations: campaignData.variations ? JSON.parse(JSON.stringify(campaignData.variations)) : null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
    },
  });

  return {
    campaigns: campaigns ?? [],
    isLoading,
    error,
    createCampaign,
    deleteCampaign,
  };
}
