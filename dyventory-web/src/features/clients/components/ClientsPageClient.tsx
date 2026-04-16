"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ClientsTable } from "./ClientsTable";
import { ClientFilters } from "./ClientFilters";
import { ClientModal } from "./ClientModal";
import type { Client, PaginatedResponse } from "@/types";

interface ClientsPageClientProps {
  clientData: PaginatedResponse<Client>;
}

export function ClientsPageClient({ clientData }: ClientsPageClientProps) {
  const t = useTranslations();
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  const handleModalClose = () => {
    setCreateOpen(false);
    setEditClient(null);
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
          {t("clients.actions.new")}
        </Button>
      </div>

      <div className="space-y-4">
        <ClientFilters />
        <ClientsTable
          clients={clientData.data}
          meta={clientData.meta}
          onEdit={(client) => setEditClient(client)}
        />
      </div>

      <ClientModal
        open={createOpen || !!editClient}
        onClose={handleModalClose}
        client={editClient}
      />
    </>
  );
}
