"use client";

/**
 * src/components/shared/DynamicFieldRenderer.tsx
 *
 * Renders any category field_schema array as a set of form inputs,
 * fully integrated with react-hook-form.
 *
 * Usage in a product or batch form:
 *
 *   const { register, control, formState: { errors } } = useForm<FormValues>({
 *     resolver: zodResolver(schemaToZod(category.field_schema, 'product')),
 *   });
 *
 *   <DynamicFieldRenderer
 *     fields={category.field_schema.filter(f => f.applies_to === 'product')}
 *     namePrefix="attributes"
 *     register={register}
 *     control={control}
 *     errors={errors.attributes}
 *   />
 */

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { FieldDefinition, FieldType } from "@/types/field-schema";

// ── Props ─────────────────────────────────────────────────────────────────────

interface DynamicFieldRendererProps {
  /** The fields to render (already filtered by applies_to if needed). */
  fields: FieldDefinition[];
  /** Prefix for field names: "attributes" → name="attributes.expiry_date" */
  namePrefix?: string;
  /** react-hook-form register function. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  /** react-hook-form control — required for checkbox and select with Controller. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  /** Validation errors from formState.errors[namePrefix] or formState.errors. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: FieldErrors<any>;
  /** Whether to show the locale labels (false = EN, true = FR). */
  useFrenchLabels?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DynamicFieldRenderer({
  fields,
  namePrefix = "attributes",
  register,
  control,
  errors = {},
  useFrenchLabels = false,
}: DynamicFieldRendererProps) {
  if (!fields.length) return null;

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <DynamicField
          key={field.key}
          field={field}
          namePrefix={namePrefix}
          register={register}
          control={control}
          error={errors?.[field.key]}
          useFrenchLabels={useFrenchLabels}
        />
      ))}
    </div>
  );
}

// ── Single field dispatcher ───────────────────────────────────────────────────

interface DynamicFieldProps {
  field: FieldDefinition;
  namePrefix: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error?: FieldErrors<any>[string];
  useFrenchLabels: boolean;
}

function DynamicField({
  field,
  namePrefix,
  register,
  control,
  error,
  useFrenchLabels,
}: DynamicFieldProps) {
  const fieldName = `${namePrefix}.${field.key}`;
  const label = useFrenchLabels ? field.label_fr : field.label;
  const errorMessage = typeof error?.message === "string" ? error.message : undefined;

  return (
    <FieldWrapper label={label} required={field.required} error={errorMessage} fieldKey={field.key}>
      <FieldInput
        field={field}
        fieldName={fieldName}
        register={register}
        control={control}
        error={errorMessage}
      />
    </FieldWrapper>
  );
}

// ── Input switcher ────────────────────────────────────────────────────────────

interface FieldInputProps {
  field: FieldDefinition;
  fieldName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  error?: string;
}

function FieldInput({ field, fieldName, register, control, error }: FieldInputProps) {
  const inputClass = cn(
    "input",
    error && "border-danger focus:border-danger focus:ring-danger/15",
  );

  switch (field.type as FieldType) {
    // ── Text ────────────────────────────────────────────────────────────────
    case "text":
      return (
        <input
          type="text"
          className={inputClass}
          aria-invalid={!!error}
          {...register(fieldName)}
        />
      );

    // ── Textarea ────────────────────────────────────────────────────────────
    case "textarea":
      return (
        <textarea
          rows={3}
          className={cn(inputClass, "resize-y min-h-[80px]")}
          aria-invalid={!!error}
          {...register(fieldName)}
        />
      );

    // ── Number ──────────────────────────────────────────────────────────────
    case "number":
      return (
        <input
          type="number"
          step="any"
          min={field.min ?? undefined}
          max={field.max ?? undefined}
          className={inputClass}
          aria-invalid={!!error}
          {...register(fieldName, { valueAsNumber: true })}
        />
      );

    // ── Date ────────────────────────────────────────────────────────────────
    case "date":
      return (
        <input
          type="date"
          className={inputClass}
          aria-invalid={!!error}
          {...register(fieldName)}
        />
      );

    // ── Select ──────────────────────────────────────────────────────────────
    case "select":
      return (
        <select
          className={inputClass}
          aria-invalid={!!error}
          {...register(fieldName)}
        >
          {!field.required && <option value="">— Select —</option>}
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    // ── Radio ───────────────────────────────────────────────────────────────
    case "radio":
      return (
        <div className="flex flex-wrap gap-4">
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={opt}
                className="accent-primary-500"
                {...register(fieldName)}
              />
              <span className="text-sm text-fg">{opt}</span>
            </label>
          ))}
        </div>
      );

    // ── Checkbox ────────────────────────────────────────────────────────────
    case "checkbox":
      return (
        <Controller
          name={fieldName}
          control={control}
          render={({ field: rhfField }) => (
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={!!rhfField.value}
                onChange={(e) => rhfField.onChange(e.target.checked)}
                className="size-4 accent-primary-500 rounded"
              />
              <span className="text-sm text-fg">Yes</span>
            </label>
          )}
        />
      );

    default:
      return <input type="text" className={inputClass} {...register(fieldName)} />;
  }
}

// ── Field wrapper (label + error) ─────────────────────────────────────────────

interface FieldWrapperProps {
  label: string;
  required: boolean;
  error?: string;
  fieldKey: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, required, error, fieldKey, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`field-${fieldKey}`} className="label">
        {label}
        {required && <span className="text-danger ml-1" aria-hidden="true">*</span>}
      </label>
      <div id={`field-${fieldKey}`}>{children}</div>
      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
