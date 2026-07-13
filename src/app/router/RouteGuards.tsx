import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RouteFallback } from "@/app/router/RouteFallback";

export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <RouteFallback />;

  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <Outlet />;
}

interface RequirePlanProps {
  allowed: Array<"starter" | "pro" | "enterprise">;
}

export function RequirePlan({ allowed }: RequirePlanProps) {
  const { subscription, loading, subscriptionLoading } = useAuth();

  if (loading || subscriptionLoading) return <RouteFallback />;

  if (!allowed.includes(subscription.plan as RequirePlanProps["allowed"][number])) {
    return <Navigate to="/pricing?reason=upgrade" replace />;
  }

  return <Outlet />;
}
