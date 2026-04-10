"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Settings2,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { CategoryModal } from "./CategoryModal";
import { deleteCategory } from "../schema/_category";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";

// ── Props ─────────────────────────────────────────────────────────────────────

interface CategoryTreeProps {
  /** Root categories with children (and grandchildren) loaded. */
  categories: Category[];
  /** Flat list of ALL categories — used by CategoryModal for parent dropdown. */
  allCategories: Category[];
}

// ── Root component ────────────────────────────────────────────────────────────

export function CategoryTree({ categories, allCategories }: CategoryTreeProps) {
  const t = useTranslations();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        <Button
          icon={<Plus className="size-4" />}
          onClick={() => setCreateOpen(true)}
        >
          {t("categories.create.title")}
        </Button>
      </div>

      {/* Tree */}
      {categories.length === 0 ? (
        <EmptyState
          message={t("categories.empty")}
          action={
            <Button
              variant="secondary"
              icon={<Plus className="size-4" />}
              onClick={() => setCreateOpen(true)}
            >
              {t("categories.create.title")}
            </Button>
          }
        />
      ) : (
        <div className="card divide-y divide-border p-0 overflow-hidden">
          {categories.map((cat) => (
            <CategoryNode
              key={cat.id}
              category={cat}
              allCategories={allCategories}
              depth={0}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      <CategoryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        allCategories={allCategories}
      />
    </div>
  );
}

// ── Tree node ─────────────────────────────────────────────────────────────────

interface CategoryNodeProps {
  category: Category;
  allCategories: Category[];
  depth: number;
}

function CategoryNode({ category, allCategories, depth }: CategoryNodeProps) {
  const t = useTranslations();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";

  const hasChildren = (category.children ?? []).length > 0;
  const [expanded, setExpanded] = useState(depth < 1);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const schemaFieldCount = (category.field_schema ?? []).length;

  const handleDelete = async () => {
    await deleteCategory(category.id);
  };

  return (
    <div>
      {/* Row */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 hover:bg-surface-muted transition-colors group",
          depth > 0 && "bg-surface-muted/30",
        )}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className={cn(
            "shrink-0 text-fg-muted rounded hover:text-fg transition-colors",
            !hasChildren && "invisible pointer-events-none",
          )}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {/* Folder icon */}
        <span className="text-primary-400 shrink-0">
          {hasChildren && expanded ? (
            <FolderOpen className="size-4" />
          ) : (
            <Folder className="size-4" />
          )}
        </span>

        {/* Name */}
        <span className="flex-1 text-sm font-medium text-fg truncate">
          {category.name}
        </span>

        {/* Schema field count badge */}
        {schemaFieldCount > 0 && (
          <Badge variant="primary" className="text-xs shrink-0">
            {schemaFieldCount} field{schemaFieldCount !== 1 ? "s" : ""}
          </Badge>
        )}

        {/* Active / Inactive */}
        {!category.is_active && (
          <Badge variant="default" className="text-xs shrink-0">
            {t("common.inactive")}
          </Badge>
        )}

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {/* Schema builder link */}
          <Link
            href={`/${locale}/categories/${category.id}`}
            className="p-1.5 rounded text-fg-muted hover:text-primary-600 hover:bg-primary-50 transition-colors"
            title="Manage field schema"
          >
            <Settings2 className="size-4" />
          </Link>

          {/* Edit */}
          <button
            onClick={() => setEditOpen(true)}
            className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors"
            aria-label={`Edit ${category.name}`}
          >
            <Pencil className="size-4" />
          </button>

          {/* Delete */}
          <button
            onClick={() => setDeleteOpen(true)}
            className="p-1.5 rounded text-fg-muted hover:text-danger hover:bg-danger-50 transition-colors"
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="border-t border-border">
          {(category.children ?? []).map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Edit modal */}
      <CategoryModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        category={category}
        allCategories={allCategories}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${category.name}"?`}
        description={
          hasChildren
            ? "This category has sub-categories. You must delete or move them before deleting this one."
            : "This will permanently delete the category. This action cannot be undone."
        }
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        variant="danger"
      />
    </div>
  );
}
