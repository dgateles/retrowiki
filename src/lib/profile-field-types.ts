// Tipos de campo de perfil e opções de visibilidade. Sem server-only: usado
// também nos formulários client.

export const FIELD_TYPES = [
  { value: "text", label: "Texto" },
  { value: "textarea", label: "Texto longo" },
  { value: "editor", label: "Editor rico" },
  { value: "url", label: "URL" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Seleção (lista)" },
  { value: "radio", label: "Opção única" },
  { value: "checkboxset", label: "Múltipla escolha" },
  { value: "yesno", label: "Sim/Não" },
  { value: "color", label: "Cor" },
] as const;

export type FieldType = (typeof FIELD_TYPES)[number]["value"];

export const FIELD_TYPE_VALUES = FIELD_TYPES.map((t) => t.value) as readonly string[];

/** Tipos que precisam de uma lista de opções configurável. */
export const TYPES_WITH_OPTIONS = new Set<FieldType>(["select", "radio", "checkboxset"]);

export const VISIBILITY = [
  { value: "none", label: "Não exibir no perfil" },
  { value: "staff", label: "Apenas equipe" },
  { value: "staff_owner", label: "Equipe e o próprio membro" },
  { value: "all", label: "Todos" },
] as const;

export type Visibility = (typeof VISIBILITY)[number]["value"];

export function fieldTypeLabel(type: string): string {
  return FIELD_TYPES.find((t) => t.value === type)?.label ?? type;
}
