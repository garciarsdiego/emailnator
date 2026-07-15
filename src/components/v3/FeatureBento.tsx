import { Blocks, Braces, GitBranch, Library, SplitSquareVertical } from "lucide-react";

const features = [
  {
    title: "Memória de marca",
    description: "Guarde tom, publico, cores e orientacoes para criar com consistencia.",
    icon: Library,
    className: "lg:col-span-2",
  },
  {
    title: "Variacoes comparaveis",
    description: "Veja alternativas de assunto, preheader e CTA antes de escolher.",
    icon: SplitSquareVertical,
    className: "lg:col-span-2",
  },
  {
    title: "Editor por blocos",
    description: "Ajuste texto, imagens, botoes e estrutura sem reconstruir o email.",
    icon: Blocks,
    className: "lg:col-span-2",
  },
  {
    title: "Funis de email",
    description: "Organize sequencias com timing e objetivo por etapa.",
    icon: GitBranch,
    className: "lg:col-span-1",
  },
  {
    title: "HTML pronto",
    description: "Exporte para usar na plataforma de envio que você escolher.",
    icon: Braces,
    className: "lg:col-span-1",
  },
];

export function FeatureBento() {
  return (
    <div className="grid auto-rows-fr gap-4 lg:grid-cols-4">
      {features.map(({ title, description, icon: Icon, className }) => (
        <article key={title} className={`v3-paper-surface rounded-lg p-6 ${className}`}>
          <div className="mb-8 flex h-11 w-11 items-center justify-center rounded-md bg-accent text-primary">
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h3 className="text-2xl">{title}</h3>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        </article>
      ))}
    </div>
  );
}
