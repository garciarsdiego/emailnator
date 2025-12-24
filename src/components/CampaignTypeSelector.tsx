import { cn } from "@/lib/utils";
import { CAMPAIGN_TYPES } from "@/lib/constants";
import {
  PartyPopper,
  ShoppingCart,
  Percent,
  Sparkles,
  Snowflake,
  RefreshCw,
  Award,
  Newspaper,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

const ICONS: Record<string, React.ReactNode> = {
  welcome: <PartyPopper className="h-5 w-5" />,
  abandoned_cart: <ShoppingCart className="h-5 w-5" />,
  promotional: <Percent className="h-5 w-5" />,
  new_product: <Sparkles className="h-5 w-5" />,
  seasonal: <Snowflake className="h-5 w-5" />,
  reengagement: <RefreshCw className="h-5 w-5" />,
  loyalty: <Award className="h-5 w-5" />,
  newsletter: <Newspaper className="h-5 w-5" />,
  feedback: <MessageSquare className="h-5 w-5" />,
  upsell: <TrendingUp className="h-5 w-5" />,
};

interface CampaignTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CampaignTypeSelector({ value, onChange }: CampaignTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Tipo de campanha
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {CAMPAIGN_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all hover:border-primary/50",
              value === type.value
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border bg-card hover:bg-accent/50"
            )}
          >
            <div
              className={cn(
                "rounded-lg p-2",
                value === type.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {ICONS[type.value]}
            </div>
            <div>
              <p className="text-sm font-medium">{type.label}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {type.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
