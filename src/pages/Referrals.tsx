import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Gift, Users, Mail, TrendingUp, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Referrals() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { referralCode, isLoading } = useProfile();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const referralLink = referralCode 
    ? `${window.location.origin}/auth?mode=signup&ref=${referralCode}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || isLoading) {
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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Programa de Indicações</h1>
          <p className="text-muted-foreground mt-1">
            Convide amigos e ganhe créditos grátis
          </p>
        </div>

        {/* Referral Link Card */}
        <Card className="glass-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Seu link de indicação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopy} variant="secondary">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com seus amigos. Quando eles se cadastrarem e usarem o Emailnator, vocês dois ganham créditos!
            </p>
          </CardContent>
        </Card>

        {/* Rewards Info */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Amigo se cadastra</p>
                  <p className="text-2xl font-bold text-primary">+2 emails</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ganhe 2 créditos de email quando seu amigo criar uma conta
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Amigo assina plano</p>
                  <p className="text-2xl font-bold text-accent">+10 emails</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ganhe 10 créditos + 2 análises quando seu amigo fizer upgrade
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-lg bg-success/10 p-2">
                  <Mail className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Amigo renova</p>
                  <p className="text-2xl font-bold text-success">+5 emails</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Ganhe 5 créditos toda vez que seu amigo renovar o plano
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Como funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium">Compartilhe seu link</p>
                  <p className="text-sm text-muted-foreground">
                    Envie seu link único para amigos, colegas ou nas redes sociais
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium">Amigo se cadastra</p>
                  <p className="text-sm text-muted-foreground">
                    Quando alguém criar uma conta usando seu link, você ganha créditos
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium">Vocês dois ganham</p>
                  <p className="text-sm text-muted-foreground">
                    Seu amigo também recebe benefícios ao se cadastrar com indicação
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
