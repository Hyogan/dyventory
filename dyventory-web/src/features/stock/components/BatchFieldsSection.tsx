"use client";

import { useTranslations } from "next-intl";
import {
  type UseFormRegister,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { DynamicFieldRenderer } from "@/components/shared/DynamicFieldRenderer";
import type { FieldDefinition } from "@/types/field-schema";

interface BatchFieldsSectionProps {
  batchFields: FieldDefinition[];
  register: UseFormRegister<Record<string, unknown>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  errors?: FieldErrors;
  namePrefix?: string;
}

/**
 * Renders the batch-level dynamic fields from the product's category schema
 * (applies_to = 'batch'). E.g. expiry_date for perishables, lot_number, etc.
 */
export function BatchFieldsSection({
  batchFields,
  register,
  control,
  errors,
  namePrefix = "attributes",
}: BatchFieldsSectionProps) {
  const t = useTranslations();

  if (batchFields.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-fg">
          {t("categories.schema.applies_to_batch")}
        </h3>
        <p className="text-xs text-fg-muted mt-0.5">
          Fields specific to this lot / batch.
        </p>
      </div>

      <DynamicFieldRenderer
        fields={batchFields}
        namePrefix={namePrefix}
        register={register}
        control={control}
        errors={errors}
      />
    </div>
  );
}
