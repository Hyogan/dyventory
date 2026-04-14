"use client";

import { useTranslations } from "next-intl";
import { type UseFormRegister } from "react-hook-form";
import { cn } from "@/lib/utils";

interface LossReasonSelectProps {
  register: UseFormRegister<Record<string, unknown>>;
  error?: string;
}

const EXIT_TYPES = [
  "out_sale",
  "out_loss",
  "out_expiry",
  "out_mortality",
] as const;

export function LossReasonSelect({ register, error }: LossReasonSelectProps) {
  const t = useTranslations("stock");

  return (
    <div>
      <label className="block text-sm font-medium text-fg mb-1">
        {t("fields.movement_type")} <span className="text-danger-500">*</span>
      </label>
      <select
        {...register("type")}
        className={cn(
          "w-full h-10 rounded-lg border bg-surface px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary-500",
          error ? "border-danger-400" : "border-border",
        )}
      >
        {EXIT_TYPES.map((type) => (
          <option key={type} value={type}>
            {t(`movement_types.${type}`)}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
