"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  ALL_FIELD_TYPES,
  FIELD_TYPE_LABELS,
  fieldTypeRequiresOptions,
  fieldTypeSupportsRange,
  type FieldDefinition,
  type FieldType,
} from "@/types/field-schema";
import { FieldTypeIcon } from "./FieldTypeIcon";

// ── Props ─────────────────────────────────────────────────────────────────────

interface FieldConfigPanelProps {
  /** The field being edited, or null for a new field. */
  field: FieldDefinition | null;
  /** Keys already present in the schema — used to enforce uniqueness. */
  existingKeys: string[];
  onSave: (field: FieldDefinition) => void;
  onCancel: () => void;
}

// ── Default state ─────────────────────────────────────────────────────────────

const EMPTY_FIELD: FieldDefinition = {
  key: "",
  label: "",
  label_fr: "",
  type: "text",
  required: false,
  applies_to: "product",
  options: [],
  min: null,
  max: null,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function FieldConfigPanel({
  field,
  existingKeys,
  onSave,
  onCancel,
}: FieldConfigPanelProps) {
  const t = useTranslations("categories.schema");
  const tc = useTranslations("common");

  const isEditing = field !== null;

  const [form, setForm] = useState<FieldDefinition>(field ?? EMPTY_FIELD);
  const [newOption, setNewOption] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(field ?? EMPTY_FIELD);
    setErrors({});
    setNewOption("");
  }, [field]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const set = <K extends keyof FieldDefinition>(
    key: K,
    value: FieldDefinition[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
  };

  const addOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if ((form.options ?? []).includes(trimmed)) return;
    set("options", [...(form.options ?? []), trimmed]);
    setNewOption("");
  };

  const removeOption = (opt: string) => {
    set("options", (form.options ?? []).filter((o) => o !== opt));
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.key.trim()) {
      errs.key = "Field key is required.";
    } else if (!/^[a-z][a-z0-9_]*$/.test(form.key)) {
      errs.key = "Key must start with a lowercase letter, contain only a–z, 0–9, _.";
    } else if (!isEditing && existingKeys.includes(form.key)) {
      errs.key = `Key "${form.key}" already exists in this schema.`;
    }

    if (!form.label.trim()) errs.label = "English label is required.";
    if (!form.label_fr.trim()) errs.label_fr = "French label is required.";

    if (fieldTypeRequiresOptions(form.type) && !(form.options ?? []).length) {
      errs.options = `At least one option is required for ${form.type} fields.`;
    }

    if (fieldTypeSupportsRange(form.type)) {
      if (form.min != null && form.max != null && form.min > form.max) {
        errs.min = "Min must be less than or equal to Max.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(form);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Key — immutable once saved */}
      <div>
        <Input
          label={t("field_key")}
          value={form.key}
          onChange={(e) => set("key", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
          disabled={isEditing}
          error={errors.key}
          placeholder="e.g. expiry_date"
          hint={isEditing ? t("key_immutable_warning") : "Snake_case, e.g. expiry_date"}
          required
        />
      </div>

      {/* Label EN */}
      <Input
        label={t("field_label")}
        value={form.label}
        onChange={(e) => set("label", e.target.value)}
        error={errors.label}
        placeholder="e.g. Expiry date (DLC)"
        required
      />

      {/* Label FR */}
      <Input
        label={t("field_label_fr")}
        value={form.label_fr}
        onChange={(e) => set("label_fr", e.target.value)}
        error={errors.label_fr}
        placeholder="e.g. Date limite de consommation"
        required
      />

      {/* Type */}
      <div className="flex flex-col gap-1">
        <label className="label" htmlFor="field-type">
          {t("field_type")} <span className="text-danger ml-1">*</span>
        </label>
        <select
          id="field-type"
          className="input"
          value={form.type}
          disabled={isEditing}
          onChange={(e) => {
            const newType = e.target.value as FieldType;
            set("type", newType);
            if (!fieldTypeRequiresOptions(newType)) set("options", []);
            if (!fieldTypeSupportsRange(newType)) { set("min", null); set("max", null); }
          }}
        >
          {ALL_FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {FIELD_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
        {isEditing && (
          <p className="text-xs text-fg-muted">Field type is immutable once saved.</p>
        )}
      </div>

      {/* Applies to */}
      <div className="flex flex-col gap-1">
        <label className="label">{t("applies_to")}</label>
        <div className="flex gap-3">
          {(["product", "batch"] as const).map((val) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="applies_to"
                value={val}
                checked={form.applies_to === val}
                onChange={() => set("applies_to", val)}
                className="accent-primary-500"
              />
              <span className="text-sm text-fg">
                {val === "product" ? t("applies_to_product") : t("applies_to_batch")}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Required toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.required}
          onChange={(e) => set("required", e.target.checked)}
          className="size-4 accent-primary-500"
        />
        <span className="text-sm text-fg">{t("field_required")}</span>
      </label>

      {/* Options (select / radio) */}
      {fieldTypeRequiresOptions(form.type) && (
        <div className="flex flex-col gap-2">
          <label className="label">Options <span className="text-danger ml-1">*</span></label>

          {/* Existing options */}
          <div className="flex flex-wrap gap-2">
            {(form.options ?? []).map((opt) => (
              <span
                key={opt}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-muted text-sm text-fg"
              >
                {opt}
                <button
                  type="button"
                  onClick={() => removeOption(opt)}
                  className="text-fg-muted hover:text-danger transition-colors"
                  aria-label={`Remove option ${opt}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Add option */}
          <div className="flex gap-2">
            <input
              type="text"
              className="input flex-1"
              placeholder="New option…"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={addOption}
            >
              Add
            </Button>
          </div>

          {errors.options && (
            <p role="alert" className="text-xs text-danger">{errors.options}</p>
          )}
        </div>
      )}

      {/* Min / Max (number) */}
      {fieldTypeSupportsRange(form.type) && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Min"
            type="number"
            step="any"
            value={form.min ?? ""}
            onChange={(e) => set("min", e.target.value === "" ? null : Number(e.target.value))}
            error={errors.min}
            placeholder="Optional"
          />
          <Input
            label="Max"
            type="number"
            step="any"
            value={form.max ?? ""}
            onChange={(e) => set("max", e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Optional"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border mt-4">
        <Button variant="ghost" onClick={onCancel}>
          {tc("cancel")}
        </Button>
        <Button onClick={handleSave}>
          {isEditing ? tc("save") : tc("create")}
        </Button>
      </div>
    </div>
  );
}
