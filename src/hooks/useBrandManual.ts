import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BrandManual {
  id: string;
  user_id: string;
  brand_name: string | null;
  primary_color: string;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string;
  heading_font: string;
  body_font: string;
  tone: string;
  language_style: string | null;
  key_phrases: string[] | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useBrandManual() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: brandManual, isLoading } = useQuery({
    queryKey: ["brand-manual", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("brand_manuals")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BrandManual | null;
    },
    enabled: !!user,
  });

  const saveBrandManual = useMutation({
    mutationFn: async (manual: Partial<Omit<BrandManual, "id" | "user_id" | "created_at" | "updated_at">>) => {
      if (!user) throw new Error("User not authenticated");
      
      // Check if exists
      const { data: existing } = await supabase
        .from("brand_manuals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update
        const { data, error } = await supabase
          .from("brand_manuals")
          .update(manual)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from("brand_manuals")
          .insert({
            ...manual,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-manual"] });
    },
  });

  return {
    brandManual,
    isLoading,
    saveBrandManual,
  };
}
