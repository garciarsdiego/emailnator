import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { VisualEmailBuilder } from "@/components/email-builder";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EmailBuilderPage() {
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

  if (!user) return null;

  const handleSave = (blocks: any[], html: string) => {
    console.log("Saving email:", { blocks, html });
    toast.success("Email salvo com sucesso!");
    navigate("/dashboard");
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden">
        <VisualEmailBuilder
          onSave={handleSave}
          onCancel={() => navigate("/dashboard")}
        />
      </main>
    </div>
  );
}
