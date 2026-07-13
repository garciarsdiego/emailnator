import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type BrandManual = Tables<"brand_manuals">;

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
    mutationFn: async (manual: TablesUpdate<"brand_manuals">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("brand_manuals")
        .upsert({ ...manual, user_id: user.id }, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
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
