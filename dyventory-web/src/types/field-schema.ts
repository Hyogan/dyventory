/**
 * src/types/field-schema.ts
 *
 * TypeScript types for the dynamic category field schema system.
 * These mirror the backend PHP FieldDefinition DTO and FieldType enum exactly.
 */

// ── Field type enum ────────────────────────────────────────────────────────────

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "checkbox"
  | "radio"
  | "textarea";

// ── Field definition ───────────────────────────────────────────────────────────

/**
 * A single field definition stored in categories.field_schema (JSONB).
 *
 * Mirrors App\DTOs\FieldDefinition on the backend.
 */
export interface FieldDefinition {
  /** Snake_case key — immutable once saved. Unique within the schema. */
  key: string;
  /** English label shown in the UI. */
  label: string;
  /** French label shown when UI is in FR locale. */
  label_fr: string;
  /** Which HTML input to render. */
  type: FieldType;
  /** Whether the field is required on the product/batch form. */
  required: boolean;
  /**
   * 'product' → appears on the product creation/edit form.
   * 'batch'   → appears on the batch/lot reception form.
   */
  applies_to: "product" | "batch";
  /** Allowed values — required for select/radio fields. */
  options?: string[];
  /** Minimum value — for number fields only. */
  min?: number | null;
  /** Maximum value — for number fields only. */
  max?: number | null;
}

// ── Field type metadata ────────────────────────────────────────────────────────

/** Human-readable label for each field type (English). */
export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text:     "Text input",
  number:   "Number input",
  date:     "Date picker",
  select:   "Dropdown select",
  checkbox: "Checkbox",
  radio:    "Radio group",
  textarea: "Multiline text",
};

/** Whether a given field type requires an options array. */
export function fieldTypeRequiresOptions(type: FieldType): boolean {
  return type === "select" || type === "radio";
}

/** Whether a given field type supports min/max constraints. */
export function fieldTypeSupportsRange(type: FieldType): boolean {
  return type === "number";
}

/** All available field types as a typed array (useful for dropdowns). */
export const ALL_FIELD_TYPES: FieldType[] = [
  "text",
  "number",
  "date",
  "select",
  "checkbox",
  "radio",
  "textarea",
];
