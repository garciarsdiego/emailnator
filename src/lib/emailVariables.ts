// Example merge-tag values used only in the local preview.
export const SAMPLE_MERGE_TAG_VALUES: Record<string, string> = {
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

export function replaceVariablesForPreview(text: string): string {
  let result = text;
  Object.entries(SAMPLE_MERGE_TAG_VALUES).forEach(([variable, value]) => {
    result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
  });
  return result;
}
