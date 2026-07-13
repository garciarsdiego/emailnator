import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authApi } from "@/features/auth/api/authApi";
import { fetchSubscription } from "@/features/billing/api/subscriptionApi";
import {
  FREE_SUBSCRIPTION,
  type SubscriptionInfo,
} from "@/features/billing/model/subscription";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscriptionLoading: boolean;
  subscription: SubscriptionInfo;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string, referralCode?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(FREE_SUBSCRIPTION);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const subscriptionRequest = useRef(0);

  const checkSubscription = useCallback(async () => {
    const requestId = ++subscriptionRequest.current;
    setSubscriptionLoading(true);
    try {
      const nextSubscription = await fetchSubscription();
      if (requestId === subscriptionRequest.current) {
        setSubscription(nextSubscription);
      }
    } catch {
      if (requestId === subscriptionRequest.current) {
        setSubscription(FREE_SUBSCRIPTION);
      }
    } finally {
      if (requestId === subscriptionRequest.current) {
        setSubscriptionLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession) {
        void checkSubscription();
      } else {
        subscriptionRequest.current += 1;
        setSubscription(FREE_SUBSCRIPTION);
        setSubscriptionLoading(false);
      }
    };

    const { data } = authApi.onAuthStateChange(applySession);
    void authApi.getSession().then(({ data: sessionData }) => applySession(sessionData.session));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [checkSubscription]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await authApi.signIn(email, password);
    return { error };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string, referralCode?: string) => {
      const { error } = await authApi.signUp({
        email,
        password,
        fullName,
        referralCode,
        redirectTo: `${window.location.origin}/dashboard`,
      });
      return { error };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await authApi.signOut();
    setUser(null);
    setSession(null);
    setSubscription(FREE_SUBSCRIPTION);
    setSubscriptionLoading(false);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      subscriptionLoading,
      subscription,
      signIn,
      signUp,
      signOut,
      checkSubscription,
    }),
    [user, session, loading, subscriptionLoading, subscription, signIn, signUp, signOut, checkSubscription],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
