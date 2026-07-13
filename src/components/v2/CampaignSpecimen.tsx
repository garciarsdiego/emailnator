import { ArrowUpRight, Check, WandSparkles } from "lucide-react";

export function CampaignSpecimen() {
  return (
    <div className="relative mx-auto w-full max-w-[34rem] pb-8 pl-3 pr-5 pt-4 lg:mr-0">
      <div className="absolute bottom-0 right-0 top-10 w-[94%] border border-foreground/20 bg-secondary" aria-hidden="true" />
      <article className="paper-panel relative overflow-hidden" aria-label="Exemplo de estrutura de uma campanha">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="eyebrow">Exemplo de composição</p>
            <p className="mt-1 text-xs text-muted-foreground">Campanha promocional · tom direto</p>
          </div>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-primary">
            <WandSparkles className="h-4 w-4" />
          </span>
        </header>

        <div className="grid md:grid-cols-[7rem_1fr]">
          <div className="hidden border-r border-border bg-muted/55 px-4 py-6 md:block">
            {[
              ["01", "Assunto"],
              ["02", "Pré-header"],
              ["03", "Corpo"],
              ["04", "Ação"],
            ].map(([number, label]) => (
              <div key={number} className="mb-6 last:mb-0">
                <span className="font-mono text-[0.62rem] text-primary">{number}</span>
                <p className="mt-1 text-xs font-semibold">{label}</p>
              </div>
            ))}
          </div>

          <div className="px-5 py-7 sm:px-7">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">Assunto</p>
            <h2 className="mt-2 text-[2rem] leading-[1.03] sm:text-[2.35rem]">
              Sua próxima peça favorita chegou.
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
              Conheça a coleção pensada para repetir — no trabalho, no fim de semana e no que vier depois.
            </p>

            <div className="my-7 h-px bg-foreground/15" />

            <div className="space-y-3">
              {["Contexto da marca aplicado", "Variações de assunto", "Conteúdo pronto para editar"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-medium">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 inline-flex items-center gap-2 border-b border-primary pb-1 text-sm font-semibold text-primary">
              Ver a coleção
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
