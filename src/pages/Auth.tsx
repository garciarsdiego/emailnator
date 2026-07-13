import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthAside } from "@/components/v2/AuthAside";
import { Brand } from "@/components/v2/Brand";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Informe um email válido.");
const passwordSchema = z.string().min(6, "Use pelo menos 6 caracteres.");

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const referralCode = searchParams.get("ref") || "";
  const requestedRedirect = searchParams.get("redirect");
  const redirectTarget = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
    ? requestedRedirect
    : "/dashboard";

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(redirectTarget, { replace: true });
  }, [user, navigate, redirectTarget]);

  const validateForm = () => {
    const nextErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);

    if (!emailResult.success) nextErrors.email = emailResult.error.errors[0].message;
    if (!passwordResult.success) nextErrors.password = passwordResult.error.errors[0].message;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message.includes("Invalid login") ? "Email ou senha incorretos." : error.message);
          return;
        }
        toast.success("Acesso confirmado.");
      } else {
        const { error } = await signUp(email, password, fullName, referralCode || undefined);
        if (error) {
          toast.error(
            error.message.includes("already registered")
              ? "Este email já está cadastrado. Entre com sua senha."
              : error.message,
          );
          return;
        }
        toast.success("Conta criada. Seu workspace está pronto.");
      }

      navigate(redirectTarget, { replace: true });
    } catch {
      toast.error("Não foi possível concluir o acesso. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((current) => !current);
    setErrors({});
  };

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.08fr_0.92fr]">
      <AuthAside />

      <main id="main-content" tabIndex={-1} className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Brand className="lg:hidden" compact />
          <Button asChild variant="ghost" size="sm" className="ml-auto text-muted-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Início
            </Link>
          </Button>
        </div>

        <div className="my-auto w-full max-w-md self-center py-12">
          <p className="eyebrow">{isLogin ? "Acessar workspace" : "Criar workspace"}</p>
          <h1 className="mt-5 text-4xl leading-[1.02] sm:text-5xl">
            {isLogin ? "Continue de onde parou." : "Sua próxima campanha começa aqui."}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {isLogin
              ? "Use seu email e senha para acessar campanhas, templates e créditos."
              : "Crie uma conta para gerar, editar e organizar suas campanhas."}
          </p>

          <form className="mt-9 space-y-5" onSubmit={handleSubmit} noValidate>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="fullName"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Como devemos chamar você?"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className="h-12 rounded-md bg-card pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
                  }}
                  className="h-12 rounded-md bg-card pl-10"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  required
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs font-medium text-destructive" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
                  }}
                  className="h-12 rounded-md bg-card pl-10"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : "password-hint"}
                  required
                />
              </div>
              {errors.password ? (
                <p id="password-error" className="text-xs font-medium text-destructive" role="alert">
                  {errors.password}
                </p>
              ) : !isLogin ? (
                <p id="password-hint" className="text-xs text-muted-foreground">Use pelo menos 6 caracteres.</p>
              ) : null}
            </div>

            {!isLogin && referralCode && (
              <div className="border-l-2 border-primary bg-accent/55 px-4 py-3 text-sm" role="status">
                Código de indicação <strong>{referralCode}</strong> aplicado.
              </div>
            )}

            <Button className="h-12 w-full" size="lg" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isLogin ? "Entrando…" : "Criando conta…"}
                </>
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar conta gratuita"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-7 border-t border-foreground/15 pt-6 text-sm">
            <span className="text-muted-foreground">
              {isLogin ? "Ainda não tem uma conta?" : "Já tem uma conta?"}
            </span>{" "}
            <button type="button" className="font-semibold text-primary hover:underline" onClick={toggleMode}>
              {isLogin ? "Criar conta" : "Entrar"}
            </button>
          </div>

          {!isLogin && (
            <p className="mt-5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-muted-foreground">
              Plano gratuito · sem cartão para começar
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
