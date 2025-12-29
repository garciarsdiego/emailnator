import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

export interface AuthResult {
  user: {
    id: string;
    email?: string;
  } | null;
  error: string | null;
}

/**
 * Validates user authentication from the Authorization header.
 * Returns the authenticated user or an error.
 */
export async function validateAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader) {
    return { user: null, error: "No authorization header provided" };
  }

  const token = authHeader.replace("Bearer ", "");
  
  // If token is the anon key, reject it - we need a real user token
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (token === anonKey) {
    return { user: null, error: "User authentication required" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  
  const supabaseClient = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error) {
      console.error("Auth validation error:", error.message);
      return { user: null, error: "Invalid or expired token" };
    }

    if (!user) {
      return { user: null, error: "User not found" };
    }

    return { 
      user: { 
        id: user.id, 
        email: user.email 
      }, 
      error: null 
    };
  } catch (err) {
    console.error("Auth validation exception:", err);
    return { user: null, error: "Authentication failed" };
  }
}

/**
 * Creates a Supabase client authenticated as the user.
 */
export function createAuthenticatedClient(token: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  
  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
