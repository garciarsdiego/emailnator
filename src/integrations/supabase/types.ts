export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brand_manuals: {
        Row: {
          accent_color: string | null
          background_color: string | null
          body_font: string | null
          brand_name: string | null
          created_at: string
          heading_font: string | null
          id: string
          key_phrases: string[] | null
          language_style: string | null
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          brand_name?: string | null
          created_at?: string
          heading_font?: string | null
          id?: string
          key_phrases?: string[] | null
          language_style?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          body_font?: string | null
          brand_name?: string | null
          created_at?: string
          heading_font?: string | null
          id?: string
          key_phrases?: string[] | null
          language_style?: string | null
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          campaign_type: string
          content: string
          created_at: string
          id: string
          niche: string
          site_analysis: Json | null
          site_url: string | null
          subject: string
          target_audience: string | null
          tone: string | null
          user_id: string
          variations: Json | null
        }
        Insert: {
          campaign_type: string
          content: string
          created_at?: string
          id?: string
          niche: string
          site_analysis?: Json | null
          site_url?: string | null
          subject: string
          target_audience?: string | null
          tone?: string | null
          user_id: string
          variations?: Json | null
        }
        Update: {
          campaign_type?: string
          content?: string
          created_at?: string
          id?: string
          niche?: string
          site_analysis?: Json | null
          site_url?: string | null
          subject?: string
          target_audience?: string | null
          tone?: string | null
          user_id?: string
          variations?: Json | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          campaign_type: string | null
          content: string
          created_at: string
          cta: string | null
          id: string
          name: string
          niche: string | null
          preheader: string | null
          subject: string
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_type?: string | null
          content: string
          created_at?: string
          cta?: string | null
          id?: string
          name: string
          niche?: string | null
          preheader?: string | null
          subject: string
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_type?: string | null
          content?: string
          created_at?: string
          cta?: string | null
          id?: string
          name?: string
          niche?: string | null
          preheader?: string | null
          subject?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_started_at: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_started_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_started_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          analyses_rewarded: number
          converted_at: string | null
          created_at: string
          emails_rewarded: number
          id: string
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          analyses_rewarded?: number
          converted_at?: string | null
          created_at?: string
          emails_rewarded?: number
          id?: string
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          analyses_rewarded?: number
          converted_at?: string | null
          created_at?: string
          emails_rewarded?: number
          id?: string
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      site_analyses: {
        Row: {
          analysis_data: Json
          created_at: string
          id: string
          site_url: string
          user_id: string
        }
        Insert: {
          analysis_data: Json
          created_at?: string
          id?: string
          site_url: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          created_at?: string
          id?: string
          site_url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          analyses_monthly_limit: number
          analyses_remaining: number
          created_at: string
          credits_expire_at: string | null
          cycle_resets_at: string | null
          emails_monthly_limit: number
          emails_remaining: number
          extra_analyses: number
          extra_emails: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analyses_monthly_limit?: number
          analyses_remaining?: number
          created_at?: string
          credits_expire_at?: string | null
          cycle_resets_at?: string | null
          emails_monthly_limit?: number
          emails_remaining?: number
          extra_analyses?: number
          extra_emails?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analyses_monthly_limit?: number
          analyses_remaining?: number
          created_at?: string
          credits_expire_at?: string | null
          cycle_resets_at?: string | null
          emails_monthly_limit?: number
          emails_remaining?: number
          extra_analyses?: number
          extra_emails?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      subscription_plan: "free" | "starter" | "pro" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      subscription_plan: ["free", "starter", "pro", "enterprise"],
    },
  },
} as const
