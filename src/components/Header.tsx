import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  CreditCard,
  FileClock,
  LayoutDashboard,
  LogOut,
  PanelsTopLeft,
  WandSparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { NavLink } from "@/components/NavLink";
import { Brand } from "@/components/v2/Brand";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  mobileLabel: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

const navigationItems: NavigationItem[] = [
  { label: "Visão geral", mobileLabel: "Início", to: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "Gerar campanha", mobileLabel: "Gerar", to: "/email-ai", icon: WandSparkles },
  { label: "Editor", mobileLabel: "Editor", to: "/email-builder", icon: PanelsTopLeft },
  { label: "Histórico", mobileLabel: "Histórico", to: "/history", icon: FileClock },
];

function ProductNavigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      className={cn(
        mobile
          ? "container flex items-center gap-1 overflow-x-auto pb-2"
          : "hidden items-center gap-0.5 lg:flex",
      )}
      aria-label={mobile ? "Navegação principal móvel" : "Navegação principal"}
    >
      {navigationItems.map(({ label, mobileLabel, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
            mobile ? "px-3 py-2" : "px-3 py-2",
          )}
          activeClassName="bg-accent text-accent-foreground"
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
          {mobile ? mobileLabel : label}
        </NavLink>
      ))}
    </nav>
  );
}

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
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-foreground/15 bg-background/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Brand to={user ? "/dashboard" : "/"} compact />

        {user ? (
          <>
            <ProductNavigation />

            <div className="flex items-center gap-3">
              <div className="hidden 2xl:block">
                <CreditsDisplay />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-10 gap-2 rounded-md px-1.5 hover:bg-muted sm:px-2"
                    aria-label="Abrir menu da conta"
                  >
                    <Avatar className="h-8 w-8 rounded-md">
                      <AvatarFallback className="rounded-md bg-foreground text-xs font-semibold text-background">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-28 truncate text-sm font-semibold xl:block">
                      {profile?.full_name?.split(" ")[0] || "Minha conta"}
                    </span>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 rounded-md border-foreground/15 p-2 shadow-lift" align="end">
                  <DropdownMenuLabel className="px-2 py-2.5">
                    <p className="truncate text-sm font-semibold">{profile?.full_name || "Minha conta"}</p>
                    <p className="mt-1 truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-md py-2" onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Visão geral
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-md py-2" onClick={() => navigate("/history")}>
                    <FileClock className="mr-2 h-4 w-4" />
                    Histórico
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-md py-2" onClick={() => navigate("/pricing")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Planos e créditos
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="rounded-md py-2 text-destructive focus:text-destructive" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" onClick={() => navigate("/auth?mode=signup")}>
              Criar conta
            </Button>
          </div>
        )}
      </div>

      {user && (
        <div className="border-t border-foreground/10 lg:hidden">
          <ProductNavigation mobile />
        </div>
      )}
    </header>
  );
}
