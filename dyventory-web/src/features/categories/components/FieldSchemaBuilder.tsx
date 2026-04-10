"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Pencil, GripVertical, AlertTriangle, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { FIELD_TYPE_LABELS, type FieldDefinition } from "@/types/field-schema";
import { FieldTypeIcon } from "./FieldTypeIcon";
import { FieldConfigPanel } from "./FieldConfigPanel";
import { updateCategorySchema } from "../schema/_schema";

// ── Props ─────────────────────────────────────────────────────────────────────

interface FieldSchemaBuilderProps {
  categoryId: number;
  /** Current field schema from the API. */
  initialSchema: FieldDefinition[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FieldSchemaBuilder({
  categoryId,
  initialSchema,
}: FieldSchemaBuilderProps) {
  const t = useTranslations("categories.schema");
  const tc = useTranslations("common");

  const [schema, setSchema] = useState<FieldDefinition[]>(initialSchema);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(
    null,
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const savedKeys = initialSchema.map((f) => f.key);
  const allCurrentKeys = schema.map((f) => f.key);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingField(null);
    setPanelOpen(true);
  };

  const openEdit = (field: FieldDefinition) => {
    setEditingField(field);
    setPanelOpen(true);
  };

  const handleSaveField = (field: FieldDefinition) => {
    if (editingField) {
      setSchema((prev) =>
        prev.map((f) => (f.key === editingField.key ? field : f)),
      );
    } else {
      setSchema((prev) => [...prev, field]);
    }
    setPanelOpen(false);
  };

  const handleSaveSchema = () => {
    setSaveError(null);
    setSaveOk(false);

    startTransition(async () => {
      const res = await updateCategorySchema(categoryId, schema);
      if (res.ok) {
        setSaveOk(true);
      } else {
        setSaveError(res.error ?? "Failed to save schema.");
      }
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">{t("description")}</p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            icon={<Plus className="size-4" />}
            onClick={openAdd}
          >
            {t("add_field")}
          </Button>
          <Button
            icon={<Save className="size-4" />}
            onClick={handleSaveSchema}
            loading={isPending}
            disabled={schema === initialSchema}
          >
            {tc("save")}
          </Button>
        </div>
      </div>

      {/* Feedback */}
      {saveError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700"
        >
          <AlertTriangle className="size-4 shrink-0" />
          {saveError}
        </div>
      )}
      {saveOk && (
        <div
          role="status"
          className="rounded-md bg-success-50 border border-success-200 px-4 py-3 text-sm text-success-700"
        >
          Schema saved successfully.
        </div>
      )}

      {/* Key immutability warning */}
      {savedKeys.length > 0 && (
        <div className="flex items-start gap-2 rounded-md bg-warning-50 border border-warning-200 px-4 py-3 text-sm text-warning-700">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{t("key_immutable_warning")}</span>
        </div>
      )}

      {/* Field list */}
      {schema.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-fg-muted text-sm mb-3">
              No fields defined yet. Add the first field to start building the
              schema.
            </p>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus className="size-4" />}
              onClick={openAdd}
            >
              {t("add_field")}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {schema.map((field, idx) => (
            <FieldCard
              key={field.key}
              field={field}
              index={idx}
              isSaved={savedKeys.includes(field.key)}
              onEdit={() => openEdit(field)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit panel modal */}
      <Modal
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={
          editingField ? `Edit field: ${editingField.key}` : t("add_field")
        }
        size="lg"
      >
        <FieldConfigPanel
          field={editingField}
          existingKeys={
            editingField
              ? allCurrentKeys.filter((k) => k !== editingField.key)
              : allCurrentKeys
          }
          onSave={handleSaveField}
          onCancel={() => setPanelOpen(false)}
        />
      </Modal>
    </div>
  );
}

// ── Field card ────────────────────────────────────────────────────────────────

interface FieldCardProps {
  field: FieldDefinition;
  index: number;
  isSaved: boolean;
  onEdit: () => void;
}

function FieldCard({ field, isSaved, onEdit }: FieldCardProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Drag handle (visual only — drag-and-drop not implemented in v1) */}
        <GripVertical className="size-4 text-fg-muted shrink-0 cursor-grab" />

        {/* Type icon */}
        <FieldTypeIcon type={field.type} className="shrink-0" />

        {/* Field info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-fg">
              {field.key}
            </span>
            {isSaved && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                saved
              </Badge>
            )}
          </div>
          <p className="text-xs text-fg-muted truncate">
            {field.label}
            {field.label_fr !== field.label && ` · ${field.label_fr}`}
          </p>
        </div>

        {/* Meta badges */}
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="primary" className="text-xs">
            {FIELD_TYPE_LABELS[field.type]}
          </Badge>
          <Badge
            variant={field.applies_to === "batch" ? "warning" : "secondary"}
            className="text-xs"
          >
            {field.applies_to}
          </Badge>
          {field.required && (
            <Badge variant="danger" className="text-xs">
              required
            </Badge>
          )}
        </div>

        {/* Edit button */}
        <button
          onClick={onEdit}
          className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors shrink-0"
          aria-label={`Edit field ${field.key}`}
        >
          <Pencil className="size-4" />
        </button>
      </div>

      {/* Options preview for select/radio */}
      {field.options && field.options.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {field.options.map((opt) => (
            <span
              key={opt}
              className="px-2 py-0.5 rounded text-xs bg-surface-muted text-fg-subtle"
            >
              {opt}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
