import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { EmailGenerator } from "@/components/EmailGenerator";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="container px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex flex-col flex-1 min-h-0">
          <div className="mb-3 sm:mb-4 flex-shrink-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground">Gerador de Emails</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Crie emails de marketing profissionais com IA
            </p>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <EmailGenerator />
          </div>
        </div>
      </main>
    </div>
  );
}
