import { Check } from "lucide-react";
import { Brand } from "@/components/v2/Brand";

const workflow = [
  "Use o contexto do seu site como referência",
  "Gere assunto, pré-header e corpo do email",
  "Refine no editor e exporte o HTML",
];

export function AuthAside() {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden border-r border-foreground/15 bg-foreground px-10 py-9 text-background lg:flex lg:flex-col xl:px-16">
      <Brand className="text-background [&>span:first-child]:bg-background [&>span:first-child]:text-foreground" />

      <div className="my-auto max-w-lg py-16">
        <p className="font-mono text-[0.69rem] uppercase tracking-[0.18em] text-primary-foreground/75">
          Da referência ao rascunho
        </p>
        <h1 className="mt-6 text-5xl leading-[1.02] xl:text-6xl">
          Uma mesa de criação para campanhas que soam como a sua marca.
        </h1>
        <p className="mt-6 max-w-md text-base leading-7 text-background/65">
          O Emailnator organiza contexto, geração e edição em um fluxo direto. Você continua no controle da mensagem.
        </p>

        <ol className="mt-10 space-y-4">
          {workflow.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-background/80">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" />
              </span>
              {item}
            </li>
          ))}
        </ol>
      </div>

      <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-background/40">
        Emailnator v2 · campaign studio
      </p>
    </aside>
  );
}
