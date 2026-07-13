import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { RequireAuth, RequirePlan } from "@/app/router/RouteGuards";
import { RouteFallback } from "@/app/router/RouteFallback";

const Index = lazy(() => import("@/pages/Index"));
const Auth = lazy(() => import("@/pages/Auth"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const EmailAI = lazy(() => import("@/pages/EmailAI"));
const History = lazy(() => import("@/pages/History"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const EmailBuilder = lazy(() => import("@/pages/EmailBuilder"));
const FunnelBuilder = lazy(() => import("@/pages/FunnelBuilder"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/email-ai" element={<EmailAI />} />
          <Route path="/history" element={<History />} />
          <Route path="/email-builder" element={<EmailBuilder />} />

          <Route element={<RequirePlan allowed={["pro", "enterprise"]} />}>
            <Route path="/funnel" element={<FunnelBuilder />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
