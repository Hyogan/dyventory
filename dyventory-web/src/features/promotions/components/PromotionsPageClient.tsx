"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { PromotionFilters } from "./PromotionFilters";
import { PromotionsTable } from "./PromotionsTable";
import { PromotionModal } from "./PromotionModal";
import type { Promotion, PaginationMeta } from "@/types";

interface PromotionsPageClientProps {
  promotions: Promotion[];
  meta: PaginationMeta;
}

export function PromotionsPageClient({ promotions, meta }: PromotionsPageClientProps) {
  const t = useTranslations("promotions");
  const [createOpen, setCreateOpen] = useState(false);
  const [editPromotion, setEditPromotion] = useState<Promotion | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PromotionFilters />
        <Button
          icon={<Plus className="size-4" />}
          onClick={() => setCreateOpen(true)}
        >
          {t("create")}
        </Button>
      </div>

      <PromotionsTable
        promotions={promotions}
        meta={meta}
        onEdit={(p) => setEditPromotion(p)}
      />

      <PromotionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      <PromotionModal
        open={editPromotion !== null}
        promotion={editPromotion}
        onClose={() => setEditPromotion(null)}
      />
    </>
  );
}
