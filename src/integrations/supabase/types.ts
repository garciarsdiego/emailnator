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
      api_rate_limits: {
        Row: {
          action: string
          last_request_at: string
          request_count: number
          user_id: string
          window_started_at: string
        }
        Insert: {
          action: string
          last_request_at?: string
          request_count?: number
          user_id: string
          window_started_at?: string
        }
        Update: {
          action?: string
          last_request_at?: string
          request_count?: number
          user_id?: string
          window_started_at?: string
        }
        Relationships: []
      }
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
      billing_customers: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          stripe_subscription_id?: string | null
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
      credit_ledger: {
        Row: {
          amount: number
          balance_after: number
          bucket: string
          created_at: string
          credit_type: string
          generation_job_id: string | null
          id: string
          idempotency_key: string
          metadata: Json
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          bucket: string
          created_at?: string
          credit_type: string
          generation_job_id?: string | null
          id?: string
          idempotency_key: string
          metadata?: Json
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          bucket?: string
          created_at?: string
          credit_type?: string
          generation_job_id?: string | null
          id?: string
          idempotency_key?: string
          metadata?: Json
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_generation_job_id_fkey"
            columns: ["generation_job_id"]
            isOneToOne: false
            referencedRelation: "generation_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      email_blocks: {
        Row: {
          block_type: string
          content: Json
          created_at: string
          email_id: string | null
          id: string
          position: number
          user_id: string
        }
        Insert: {
          block_type: string
          content?: Json
          created_at?: string
          email_id?: string | null
          id?: string
          position?: number
          user_id: string
        }
        Update: {
          block_type?: string
          content?: Json
          created_at?: string
          email_id?: string | null
          id?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      email_documents: {
        Row: {
          blocks: Json
          created_at: string
          id: string
          name: string
          preheader: string
          rendered_html: string
          schema_version: number
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          blocks?: Json
          created_at?: string
          id?: string
          name: string
          preheader?: string
          rendered_html?: string
          schema_version?: number
          subject?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          blocks?: Json
          created_at?: string
          id?: string
          name?: string
          preheader?: string
          rendered_html?: string
          schema_version?: number
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          niche: string | null
          status: string
          tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          niche?: string | null
          status?: string
          tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          niche?: string | null
          status?: string
          tone?: string | null
          updated_at?: string
          user_id?: string
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
      generation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          credit_type: string
          credits_reserved: number
          error_code: string | null
          error_message: string | null
          id: string
          idempotency_key: string
          job_type: string
          refunded_at: string | null
          request_fingerprint: string | null
          result: Json | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          credit_type: string
          credits_reserved: number
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key: string
          job_type: string
          refunded_at?: string | null
          request_fingerprint?: string | null
          result?: Json | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          credit_type?: string
          credits_reserved?: number
          error_code?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string
          job_type?: string
          refunded_at?: string | null
          request_fingerprint?: string | null
          result?: Json | null
          started_at?: string | null
          status?: string
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
          plan_source: string
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
          plan_source?: string
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
          plan_source?: string
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
      sequence_emails: {
        Row: {
          content: string
          created_at: string
          delay_days: number
          id: string
          name: string
          position: number
          preheader: string | null
          sequence_id: string
          subject: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          delay_days?: number
          id?: string
          name: string
          position?: number
          preheader?: string | null
          sequence_id: string
          subject: string
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          delay_days?: number
          id?: string
          name?: string
          position?: number
          preheader?: string | null
          sequence_id?: string
          subject?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequence_emails_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
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
      stripe_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_id: string
          event_type: string
          payload: Json
          processed_at: string | null
          processing_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_id: string
          event_type: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_credit_cycles: {
        Row: {
          created_at: string
          id: string
          period_end: string | null
          period_start: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          source_event_key: string
          stripe_subscription_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          source_event_key: string
          stripe_subscription_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          source_event_key?: string
          stripe_subscription_id?: string
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
      apply_credit_adjustment: {
        Args: {
          p_amount: number
          p_bucket: string
          p_credit_type: string
          p_idempotency_key: string
          p_metadata?: Json
          p_reason: string
          p_user_id: string
        }
        Returns: Json
      }
      complete_generation_job: {
        Args: { p_job_id: string; p_result: Json; p_user_id: string }
        Returns: undefined
      }
      consume_analysis_credit: { Args: { p_user_id: string }; Returns: boolean }
      consume_email_credit: { Args: { p_user_id: string }; Returns: boolean }
      enforce_api_rate_limit: {
        Args: {
          p_action: string
          p_max_requests: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_generation_job_processing: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: undefined
      }
      refund_generation_credits: {
        Args: {
          p_error_code: string
          p_error_message?: string
          p_job_id: string
          p_user_id: string
        }
        Returns: Json
      }
      refund_stale_generation_jobs: {
        Args: { p_older_than_seconds?: number; p_user_id: string }
        Returns: number
      }
      reserve_generation_credits: {
        Args: {
          p_amount: number
          p_credit_type: string
          p_idempotency_key: string
          p_job_type: string
          p_request_fingerprint?: string
          p_user_id: string
        }
        Returns: Json
      }
      save_email_sequence: {
        Args: {
          p_description: string
          p_emails: Json
          p_name: string
          p_niche: string
          p_tone: string
        }
        Returns: string
      }
      sync_subscription_state: {
        Args: {
          p_cancel_at_period_end?: boolean
          p_current_period_end?: string
          p_current_period_start?: string
          p_plan: string
          p_reset_cycle?: boolean
          p_source_event_key?: string
          p_status: string
          p_stripe_customer_id?: string
          p_stripe_price_id?: string
          p_stripe_product_id?: string
          p_stripe_subscription_id?: string
          p_user_id: string
        }
        Returns: Json
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
