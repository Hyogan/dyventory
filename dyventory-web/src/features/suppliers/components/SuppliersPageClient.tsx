"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SuppliersTable } from "./SuppliersTable";
import { SupplierFilters } from "./SupplierFilters";
import { SupplierModal } from "./SupplierModal";
import type { Supplier, PaginatedResponse } from "@/types";

interface SuppliersPageClientProps {
  supplierData: PaginatedResponse<Supplier>;
}

export function SuppliersPageClient({ supplierData }: SuppliersPageClientProps) {
  const t = useTranslations();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);

  const handleModalClose = () => {
    setCreateOpen(false);
    setEditSupplier(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
          {t("suppliers.actions.new")}
        </Button>
      </div>

      <div className="space-y-4">
        <SupplierFilters />
        <SuppliersTable
          suppliers={supplierData.data}
          meta={supplierData.meta}
          onEdit={(supplier) => setEditSupplier(supplier)}
        />
      </div>

      <SupplierModal
        open={createOpen || !!editSupplier}
        onClose={handleModalClose}
        supplier={editSupplier}
      />
    </>
  );
}
