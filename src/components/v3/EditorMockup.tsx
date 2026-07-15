import { Code2, Image, Mail, MousePointer2, Palette, Save, Type } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorMockupProps {
  compact?: boolean;
  className?: string;
}

const blockItems = [
  { label: "Texto", icon: Type },
  { label: "Imagem", icon: Image },
  { label: "Botão", icon: MousePointer2 },
  { label: "HTML", icon: Code2 },
];

export function EditorMockup({ compact = false, className }: EditorMockupProps) {
  return (
    <div className={cn("v3-paper-surface overflow-hidden rounded-lg", className)}>
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Mail className="h-4 w-4 text-primary" />
          Nova campanha
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-md border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground sm:inline-flex">
            Preview
          </span>
          <span className="inline-flex rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            Salvar
          </span>
        </div>
      </div>

      <div className={cn("grid", compact ? "grid-cols-[1fr]" : "md:grid-cols-[8.5rem_1fr_12rem]")}>
        {!compact && (
          <aside className="hidden border-r border-border/80 bg-muted/45 p-3 md:block">
            <p className="mb-3 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-muted-foreground">Blocos</p>
            <div className="grid grid-cols-2 gap-2">
              {blockItems.map(({ label, icon: Icon }) => (
                <div key={label} className="grid min-h-16 place-items-center rounded-md border border-border bg-card text-center text-[0.68rem]">
                  <Icon className="mb-1 h-4 w-4 text-primary" />
                  {label}
                </div>
              ))}
            </div>
          </aside>
        )}

        <main className="bg-background px-5 py-6 sm:px-8">
          <div className="mx-auto max-w-lg rounded-md bg-card p-7 shadow-sm">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-primary">Nova colecao</p>
            <h3 className="mt-4 v3-display text-4xl leading-[0.98]">
              Feito para o que importa.
            </h3>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Peças selecionadas, uma mensagem clara e uma chamada pronta para revisar.
            </p>
            <button className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Ver novidades
            </button>
            <div className="mt-7 aspect-[16/9] rounded-md bg-[linear-gradient(135deg,hsl(var(--accent)),hsl(var(--secondary)))]" />
          </div>
        </main>

        {!compact && (
          <aside className="hidden border-l border-border/80 bg-card/80 p-4 md:block">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold">
              <Palette className="h-4 w-4 text-primary" />
              Estilo
            </div>
            {["Fonte", "Cor", "Espacamento", "Bordas"].map((item) => (
              <div key={item} className="mb-3 rounded-md border border-border bg-background px-3 py-2">
                <p className="text-[0.66rem] text-muted-foreground">{item}</p>
                <div className="mt-2 h-2 rounded-full bg-muted" />
              </div>
            ))}
            <div className="mt-6 flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">
              <Save className="h-3.5 w-3.5" />
              Exportar HTML
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

export function BriefingMockup() {
  const rows = [
    ["Memória da marca", "Tom direto, elegante e útil para pequenos times."],
    ["Público", "Criadores, ecommerce, agências e founders SaaS."],
    ["Oferta", "Campanha, lançamento, nutrição ou recuperação."],
    ["Objeções", "Preço, tempo, confiança e momento de compra."],
  ];

  return (
    <div className="v3-paper-surface rotate-[-1deg] rounded-lg p-4 shadow-[var(--shadow-v3-paper)]">
      <div className="mb-4 flex gap-2 overflow-hidden">
        {["Objetivo", "Contexto", "Estrutura", "Gerar"].map((tab, index) => (
          <span
            key={tab}
            className={cn(
              "rounded-md border px-4 py-2 text-xs font-semibold",
              index === 1 ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground",
            )}
          >
            {tab}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-3 rounded-md border border-border bg-card p-4 sm:grid-cols-[11rem_1fr]">
            <div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="mt-1 text-xs text-muted-foreground">Contexto usado pela IA</p>
            </div>
            <p className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FunnelMockup() {
  const steps = ["Boas-vindas", "Conteudo", "Oferta", "Lembrete", "Recuperacao"];

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_17rem]">
      <div className="flex gap-4 overflow-x-auto pb-3">
        {steps.map((step, index) => (
          <div key={step} className="flex min-w-40 items-center gap-4">
            <article className="v3-paper-surface min-h-48 w-36 rounded-lg p-3">
              <Mail className="h-4 w-4 text-primary" />
              <h4 className="mt-5 text-sm font-semibold">{step}</h4>
              <div className="mt-5 aspect-[4/3] rounded-md bg-accent" />
              <div className="mt-4 space-y-2">
                <div className="h-2 w-20 rounded-full bg-muted" />
                <div className="h-2 w-14 rounded-full bg-muted" />
              </div>
            </article>
            {index < steps.length - 1 && (
              <div className="hidden min-w-12 text-center text-xs text-muted-foreground sm:block">
                2 dias
              </div>
            )}
          </div>
        ))}
      </div>

      <aside className="v3-paper-surface rounded-lg p-5">
        <p className="text-sm font-semibold">Etapa selecionada</p>
        <div className="mt-5 space-y-4">
          {["Etapa", "Atraso", "Condicao", "Objetivo"].map((field) => (
            <div key={field}>
              <label className="text-xs font-medium text-muted-foreground">{field}</label>
              <div className="mt-1 rounded-md border border-border bg-background px-3 py-2 text-sm">Conteudo principal</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
