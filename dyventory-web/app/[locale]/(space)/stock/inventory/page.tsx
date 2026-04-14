"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ClipboardList, Loader2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { InventoryCountForm } from "@/features/stock/components/InventoryCountForm";
import { startInventorySession, type InventorySession } from "@/features/stock/actions";

export default function InventoryPage() {
  const t = useTranslations("stock");
  const router = useRouter();
  const [session, setSession] = useState<InventorySession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      const result = await startInventorySession();
      if (result.success && result.session) {
        setSession(result.session);
        setError(null);
      } else {
        setError(result.message ?? "Could not start session.");
      }
    });
  };

  const handleComplete = () => {
    router.push("../stock");
    router.refresh();
  };

  return (
    <div>
      <PageHeader
        title={t("inventory.title")}
        breadcrumb={[
          { label: "Dashboard", href: "../../dashboard" },
          { label: "Stock", href: "../stock" },
          { label: t("inventory.title") },
        ]}
      />

      {!session ? (
        <div className="max-w-xl rounded-xl border border-border bg-surface p-8 text-center space-y-4">
          <ClipboardList className="size-12 text-fg-muted mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-fg">{t("inventory.title")}</h2>
            <p className="text-sm text-fg-muted mt-1">
              Start a physical inventory session. The system will snapshot current stock
              levels. Enter your physical counts and review discrepancies before applying
              automatic adjustments.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700 flex items-start gap-2 text-left">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={isPending}
            icon={isPending ? <Loader2 className="size-4 animate-spin" /> : <ClipboardList className="size-4" />}
          >
            {t("inventory.start")}
          </Button>
        </div>
      ) : (
        <InventoryCountForm session={session} onComplete={handleComplete} />
      )}
    </div>
  );
}
