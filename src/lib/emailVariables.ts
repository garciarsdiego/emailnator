// Email template variables that users can use
export const EMAIL_VARIABLES = [
  { key: "{{nome}}", label: "Nome", description: "Nome do destinatário", example: "Maria" },
  { key: "{{primeiro_nome}}", label: "Primeiro Nome", description: "Primeiro nome do destinatário", example: "Maria" },
  { key: "{{email}}", label: "Email", description: "Email do destinatário", example: "maria@email.com" },
  { key: "{{empresa}}", label: "Empresa", description: "Nome da empresa/loja", example: "Sua Loja" },
  { key: "{{data}}", label: "Data", description: "Data atual formatada", example: "24 de Dezembro" },
  { key: "{{desconto}}", label: "Desconto", description: "Valor do desconto", example: "20%" },
  { key: "{{codigo}}", label: "Código", description: "Código promocional", example: "PROMO20" },
  { key: "{{produto}}", label: "Produto", description: "Nome do produto", example: "Camiseta Premium" },
  { key: "{{preco}}", label: "Preço", description: "Preço do produto", example: "R$ 99,90" },
  { key: "{{link}}", label: "Link", description: "Link da oferta/produto", example: "https://sualoja.com/oferta" },
  { key: "{{validade}}", label: "Validade", description: "Data de validade da oferta", example: "31/12/2024" },
] as const;

export type EmailVariable = typeof EMAIL_VARIABLES[number];

// Dummy values for preview
export const DUMMY_VALUES: Record<string, string> = {
  "{{nome}}": "Maria Silva",
  "{{primeiro_nome}}": "Maria",
  "{{email}}": "maria@email.com",
  "{{empresa}}": "Sua Loja",
  "{{data}}": new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' }),
  "{{desconto}}": "20%",
  "{{codigo}}": "PROMO20",
  "{{produto}}": "Produto Exemplo",
  "{{preco}}": "R$ 99,90",
  "{{link}}": "https://sualoja.com/oferta",
  "{{validade}}": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
};

// Replace variables in text with dummy values
export function replaceVariablesWithDummy(text: string): string {
  let result = text;
  Object.entries(DUMMY_VALUES).forEach(([variable, value]) => {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
  });
  return result;
}

// Check if text contains any variables
export function hasVariables(text: string): boolean {
  return EMAIL_VARIABLES.some(v => text.includes(v.key));
}
