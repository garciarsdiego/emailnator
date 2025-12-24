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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container flex-1 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Gerador de Emails</h1>
          <p className="text-muted-foreground text-sm">
            Crie emails de marketing profissionais com IA
          </p>
        </div>
        <EmailGenerator />
      </main>
    </div>
  );
}
