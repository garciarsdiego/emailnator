import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, CreditCard, Gift, History, Mail, GitBranch } from "lucide-react";
import { NavLink } from "@/components/NavLink";

export function Header() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            E
          </div>
          <span className="text-xl font-bold">Emailnator</span>
        </Link>

        {user && (
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-1">
              <NavLink 
                to="/email-builder" 
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                activeClassName="text-foreground bg-muted"
              >
                <Mail className="h-4 w-4" />
                Editor Visual
              </NavLink>
              <NavLink 
                to="/funnel" 
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                activeClassName="text-foreground bg-muted"
              >
                <GitBranch className="h-4 w-4" />
                Fluxo de Funil
              </NavLink>
            </nav>

            <CreditsDisplay />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{profile?.full_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <User className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/history")}>
                  <History className="mr-2 h-4 w-4" />
                  Histórico
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/referrals")}>
                  <Gift className="mr-2 h-4 w-4" />
                  Indicações
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/pricing")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Planos e Créditos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {!user && (
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button onClick={() => navigate("/auth?mode=signup")}>
              Começar Grátis
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
