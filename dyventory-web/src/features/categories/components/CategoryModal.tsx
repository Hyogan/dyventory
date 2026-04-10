"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createCategory,
  updateCategory,
  type ActionResult,
} from "../schema/_category";
import type { Category } from "@/types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface CategoryModalProps {
  open: boolean;
  onClose: () => void;
  /** If set → edit mode; if null → create mode. */
  category?: Category | null;
  /** Flat list of all categories, used for parent dropdown. */
  allCategories: Category[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CategoryModal({
  open,
  onClose,
  category,
  allCategories,
}: CategoryModalProps) {
  const t = useTranslations();
  const isEditing = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState<number | "">(
    category?.parent_id ?? "",
  );
  const [description, setDescription] = useState(category?.description ?? "");
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenChange = () => {
    setName(category?.name ?? "");
    setParentId(category?.parent_id ?? "");
    setDescription(category?.description ?? "");
    setIsActive(category?.is_active ?? true);
    setResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const payload = {
        name: name.trim(),
        parent_id: parentId !== "" ? Number(parentId) : null,
        description: description.trim() || null,
        is_active: isActive,
      };

      const res = isEditing
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);

      setResult(res);

      if (res.ok) {
        onClose();
        handleOpenChange();
      }
    });
  };

  const parentOptions = allCategories.filter((c) => c.id !== category?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEditing ? t("categories.edit.title") : t("categories.create.title")
      }
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="category-form" loading={isPending}>
            {isEditing ? t("common.save") : t("common.create")}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Global error */}
        {result && !result.ok && result.error && (
          <div
            role="alert"
            className="rounded-md bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700"
          >
            {result.error}
          </div>
        )}

        {/* Name */}
        <Input
          label={t("categories.fields.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          error={result?.fieldErrors?.name?.[0]}
          placeholder="e.g. Food — Perishable"
        />

        {/* Parent category */}
        <div className="flex flex-col gap-1">
          <label htmlFor="parent-select" className="label">
            {t("categories.fields.parent")}
          </label>
          <select
            id="parent-select"
            className="input"
            value={parentId}
            onChange={(e) =>
              setParentId(e.target.value === "" ? "" : Number(e.target.value))
            }
          >
            <option value="">— No parent (root category) —</option>
            {parentOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {result?.fieldErrors?.parent_id?.[0] && (
            <p role="alert" className="text-xs text-danger">
              {result.fieldErrors.parent_id[0]}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="label">
            Description
            <span className="text-fg-muted ml-1 font-normal text-xs">
              ({t("common.optional")})
            </span>
          </label>
          <textarea
            id="description"
            rows={2}
            className="input resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this category…"
          />
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-primary-500"
          />
          <span className="text-sm text-fg">{t("common.active")}</span>
        </label>
      </form>
    </Modal>
  );
}
