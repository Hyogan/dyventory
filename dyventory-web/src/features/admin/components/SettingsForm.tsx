"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Save, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VatRatesTable } from "./VatRatesTable";
import { VatRateModal } from "./VatRateModal";
import { updateSettings } from "../actions";
import type { Setting, VatRate } from "@/types";

interface SettingsFormProps {
  settingsByGroup: Record<string, Setting[]>;
  vatRates: VatRate[];
}

const INPUT_TYPES: Record<string, string> = {
  string: "text",
  integer: "number",
  float: "number",
  boolean: "checkbox",
};

export function SettingsForm({ settingsByGroup, vatRates }: SettingsFormProps) {
  const tc = useTranslations("common");
  const ts = useTranslations("admin.settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [vatRateModal, setVatRateModal] = useState(false);
  const [editVatRate, setEditVatRate] = useState<VatRate | null>(null);

  // Build mutable state from settings
  const [values, setValues] = useState<Record<string, string | boolean>>(() => {
    const init: Record<string, string | boolean> = {};
    for (const group of Object.values(settingsByGroup)) {
      for (const setting of group) {
        if (setting.type === "boolean") {
          init[setting.key] = setting.value === true || setting.value === "true" || setting.value === 1;
        } else {
          init[setting.key] = String(setting.value ?? "");
        }
      }
    }
    return init;
  });

  const groupLabels: Record<string, string> = {
    company: ts("groups.company"),
    alerts: ts("groups.alerts"),
    invoices: ts("groups.invoices"),
    tax: ts("groups.tax"),
  };

  const handleSave = () => {
    startTransition(async () => {
      const payload: Record<string, string | number | boolean | null> = {};
      for (const [key, val] of Object.entries(values)) {
        payload[key] = val;
      }
      const result = await updateSettings(payload);
      if (result.success) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8">
      {Object.entries(settingsByGroup).map(([group, settings]) => (
        <div key={group} className="card">
          <div className="p-5 border-b border-border">
            <h2 className="text-sm font-semibold text-fg">
              {groupLabels[group] ?? group}
            </h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {settings.map((setting) => (
              <div key={setting.key}>
                <label className="label">{setting.label ?? setting.key}</label>
                {setting.type === "boolean" ? (
                  <div className="mt-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={values[setting.key] as boolean}
                        onChange={(e) =>
                          setValues((prev) => ({ ...prev, [setting.key]: e.target.checked }))
                        }
                        className="size-4 rounded accent-primary-600"
                      />
                      <span className="text-sm text-fg">{tc("active")}</span>
                    </label>
                  </div>
                ) : setting.type === "json" ? (
                  <textarea
                    value={values[setting.key] as string}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                    }
                    className="input mt-1 text-sm font-mono min-h-[80px] resize-y"
                  />
                ) : (
                  <input
                    type={INPUT_TYPES[setting.type] ?? "text"}
                    value={values[setting.key] as string}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                    }
                    className="input mt-1 text-sm"
                    step={setting.type === "float" ? "0.01" : undefined}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* VAT Rates section */}
      <div className="card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg">{ts("vat_rates")}</h2>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="size-3.5" />}
            onClick={() => setVatRateModal(true)}
          >
            {ts("new_rate")}
          </Button>
        </div>
        <div className="p-5">
          <VatRatesTable
            vatRates={vatRates}
            onEdit={(vr) => { setEditVatRate(vr); setVatRateModal(true); }}
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button icon={<Save className="size-4" />} onClick={handleSave} loading={isPending}>
          {tc("save")}
        </Button>
      </div>

      <VatRateModal
        open={vatRateModal}
        onClose={() => { setVatRateModal(false); setEditVatRate(null); }}
        vatRate={editVatRate}
      />
    </div>
  );
}
