"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PackageCheck } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { receiveOrder } from "../actions";
import type { SupplierOrder, SupplierOrderItem } from "@/types";

interface ReceiveOrderFormProps {
  open: boolean;
  onClose: () => void;
  order: SupplierOrder;
}

interface ItemReceive {
  order_item_id: number;
  quantity_received: string;
  batch_number: string;
  expiry_date: string;
}

export function ReceiveOrderForm({ open, onClose, order }: ReceiveOrderFormProps) {
  const t = useTranslations("suppliers");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [items, setItems] = useState<ItemReceive[]>(() =>
    (order.items ?? []).map((item: SupplierOrderItem) => ({
      order_item_id: item.id,
      quantity_received: String(item.quantity_remaining ?? item.quantity_ordered),
      batch_number: "",
      expiry_date: "",
    })),
  );

  const updateItem = (index: number, field: keyof ItemReceive, value: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        items: items.map((item) => ({
          order_item_id: item.order_item_id,
          quantity_received: parseFloat(item.quantity_received) || 0,
          batch_number: item.batch_number || undefined,
          expiry_date: item.expiry_date || undefined,
        })),
      };

      const result = await receiveOrder(order.id, payload);

      if (result.success) {
        router.refresh();
        onClose();
      } else {
        setErrors(result.errors ?? {});
      }
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("receive_form.title")}
      description={`${t("orders.order_number")}: ${order.order_number}`}
      size="2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t("common.cancel", { ns: "" })}
          </Button>
          <Button
            icon={<PackageCheck className="size-4" />}
            onClick={handleSubmit}
            loading={isPending}
          >
            {t("receive_form.submit")}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {(order.items ?? []).map((orderItem: SupplierOrderItem, index: number) => {
          const formItem = items[index];
          if (!formItem) return null;

          return (
            <div key={orderItem.id} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-fg">
                    {orderItem.product?.name ?? `Product #${orderItem.product_id}`}
                  </p>
                  <p className="text-xs text-fg-muted">
                    {t("orders.ordered")}: {orderItem.quantity_ordered} ·{" "}
                    {t("orders.remaining")}: {orderItem.quantity_remaining}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">{t("receive_form.qty_received")}</label>
                  <input
                    type="number"
                    min="0"
                    max={orderItem.quantity_remaining}
                    step="0.001"
                    value={formItem.quantity_received}
                    onChange={(e) => updateItem(index, "quantity_received", e.target.value)}
                    className="input mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs">{t("receive_form.batch_number")}</label>
                  <input
                    type="text"
                    value={formItem.batch_number}
                    onChange={(e) => updateItem(index, "batch_number", e.target.value)}
                    className="input mt-1 text-sm"
                    placeholder={t("receive_form.batch_optional")}
                  />
                </div>
                <div>
                  <label className="label text-xs">{t("receive_form.expiry_date")}</label>
                  <input
                    type="date"
                    value={formItem.expiry_date}
                    onChange={(e) => updateItem(index, "expiry_date", e.target.value)}
                    className="input mt-1 text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {errors.items && (
          <p className="text-xs text-danger-600">{errors.items[0]}</p>
        )}
      </div>
    </Modal>
  );
}
