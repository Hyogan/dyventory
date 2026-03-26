export interface FieldDefinition {
  name: string;
  type: "text" | "number" | "select" | "boolean" | "date";
  label: string;
  required?: boolean;
  options?: string[]; // for select
  default?: unknown;
}
