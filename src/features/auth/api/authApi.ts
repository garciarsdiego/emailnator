import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface SignUpInput {
  email: string;
  password: string;
  fullName?: string;
  referralCode?: string;
  redirectTo: string;
}

export const authApi = {
  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (callback: (session: Session | null) => void) =>
    supabase.auth.onAuthStateChange((_event, session) => callback(session)),

  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signUp: ({ email, password, fullName, referralCode, redirectTo }: SignUpInput) =>
    supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: fullName?.trim() || undefined,
          referral_code: referralCode?.trim() || undefined,
        },
      },
    }),

  signOut: () => supabase.auth.signOut(),
};
