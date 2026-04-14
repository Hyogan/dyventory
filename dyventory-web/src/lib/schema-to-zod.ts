/**
 * src/lib/schema-to-zod.ts
 *
 * Converts a FieldDefinition[] (from a category's field_schema) into a
 * Zod object schema that can validate the `attributes` object on a
 * product or batch form.
 *
 * Used in Product form (Phase 3) and Batch form (Phase 4) server actions.
 *
 * @example
 *   const schema = schemaToZod(category.field_schema);
 *   const parsed = schema.parse(formData.attributes);
 */

import { z } from "zod";
import type { FieldDefinition } from "@/types/field-schema";

// ── Core converter ────────────────────────────────────────────────────────────

/**
 * Convert an array of FieldDefinition DTOs into a z.ZodObject schema.
 * The resulting schema validates the `attributes` JSONB of a product or batch.
 *
 * @param fields - The field definitions (from category.field_schema)
 * @param appliesTo - Filter fields by their applies_to context.
 *                    Pass 'product' for product forms, 'batch' for batch forms.
 *                    Defaults to validating ALL fields regardless of applies_to.
 */
export function schemaToZod(
  fields: FieldDefinition[],
  appliesTo?: "product" | "batch",
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const targetFields = appliesTo
    ? fields.filter((f) => f.applies_to === appliesTo)
    : fields;

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of targetFields) {
    shape[field.key] = buildFieldValidator(field);
  }

  return z.object(shape);
}

// ── Per-type validator builders ───────────────────────────────────────────────

function buildFieldValidator(field: FieldDefinition): z.ZodTypeAny {
  let validator: z.ZodTypeAny;

  switch (field.type) {
    case "text":
      validator = z.string().max(1000, `${field.label} must be at most 1000 characters.`);
      break;

    case "textarea":
      validator = z.string().max(5000, `${field.label} must be at most 5000 characters.`);
      break;

    case "number": {
      let num = z.coerce.number({
        error: `${field.label} must be a number.`,
      });
      if (field.min != null) {
        num = num.min(field.min, `${field.label} must be at least ${field.min}.`);
      }
      if (field.max != null) {
        num = num.max(field.max, `${field.label} must be at most ${field.max}.`);
      }
      validator = num;
      break;
    }

    case "date":
      validator = z.string().refine(
        (val) => !isNaN(Date.parse(val)),
        { message: `${field.label} must be a valid date.` },
      );
      break;

    case "select":
    case "radio": {
      const options = field.options ?? [];
      if (options.length > 0) {
        validator = z.enum(options as [string, ...string[]], {
          error: `${field.label} must be one of: ${options.join(", ")}.`,
        });
      } else {
        validator = z.string();
      }
      break;
    }

    case "checkbox":
      validator = z.boolean();
      break;

    default:
      validator = z.unknown();
  }

  // Handle required vs optional
  if (field.required) {
    // Add non-empty constraint for strings
    if (field.type === "text" || field.type === "textarea") {
      validator = (validator as z.ZodString).min(1, `${field.label} is required.`);
    }
    return validator;
  } else {
    return validator.optional().nullable();
  }
}

// ── Utility: merge schemas ────────────────────────────────────────────────────

/**
 * Merge two Zod schemas (e.g. merge product fields + batch fields when needed).
 */
export function mergeFieldSchemas(
  a: z.ZodObject<Record<string, z.ZodTypeAny>>,
  b: z.ZodObject<Record<string, z.ZodTypeAny>>,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  return a.merge(b);
}
