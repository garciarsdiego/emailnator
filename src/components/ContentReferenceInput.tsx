import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, FolderOpen, FileText, Link } from "lucide-react";

export type ContentReferenceType = "none" | "product" | "category" | "blog";

export interface ContentReference {
  type: ContentReferenceType;
  url: string;
  description?: string;
}

interface ContentReferenceInputProps {
  value: ContentReference;
  onChange: (value: ContentReference) => void;
}

export function ContentReferenceInput({ value, onChange }: ContentReferenceInputProps) {
  const handleTypeChange = (type: ContentReferenceType) => {
    onChange({ ...value, type, url: type === "none" ? "" : value.url });
  };

  const handleUrlChange = (url: string) => {
    onChange({ ...value, url });
  };

  const handleDescriptionChange = (description: string) => {
    onChange({ ...value, description });
  };

  const placeholders: Record<ContentReferenceType, string> = {
    none: "",
    product: "https://sua-loja.com.br/produto/nome-do-produto",
    category: "https://sua-loja.com.br/categoria/moda-feminina",
    blog: "https://sua-loja.com.br/blog/titulo-do-post",
  };

  const labels: Record<ContentReferenceType, string> = {
    none: "Nenhum",
    product: "Produto Específico",
    category: "Categoria/Coleção",
    blog: "Post do Blog",
  };

  const icons: Record<ContentReferenceType, React.ReactNode> = {
    none: <Link className="h-4 w-4" />,
    product: <Package className="h-4 w-4" />,
    category: <FolderOpen className="h-4 w-4" />,
    blog: <FileText className="h-4 w-4" />,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Referência de Conteúdo (Opcional)</Label>
        <p className="text-xs text-muted-foreground">
          Adicione uma URL específica para personalizar o email com informações de um produto, categoria ou post
        </p>
      </div>

      <RadioGroup
        value={value.type}
        onValueChange={(v) => handleTypeChange(v as ContentReferenceType)}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      >
        {(["none", "product", "category", "blog"] as const).map((type) => (
          <div key={type}>
            <RadioGroupItem
              value={type}
              id={`content-${type}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`content-${type}`}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-muted bg-card p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
            >
              {icons[type]}
              <span className="text-xs font-medium">{labels[type]}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>

      {value.type !== "none" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label htmlFor="content-url" className="text-sm">
              URL do {labels[value.type]}
            </Label>
            <Input
              id="content-url"
              placeholder={placeholders[value.type]}
              value={value.url}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-description" className="text-sm">
              Descrição adicional (opcional)
            </Label>
            <Input
              id="content-description"
              placeholder="Ex: Novo lançamento com 20% OFF, coleção verão 2024..."
              value={value.description || ""}
              onChange={(e) => handleDescriptionChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}