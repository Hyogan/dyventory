"use client";

import { useEffect, useState } from "react";
import { QrCode, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { clientAuthFetch } from "@/lib/client-auth";

interface BarcodeDisplayProps {
  productId: number;
  barcode: string | null;
  sku: string;
}

interface BarcodeData {
  barcode_value: string;
  code128: string;
  qr: string;
}

export function BarcodeDisplay({ productId, barcode, sku }: BarcodeDisplayProps) {
  const [data, setData] = useState<BarcodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const displayValue = barcode ?? sku;

  const fetchBarcode = async () => {
    setLoading(true);
    try {
      const res = await clientAuthFetch<{ data: BarcodeData }>(
        `/products/${productId}/barcode`,
      );
      setData(res.data);
    } catch (err) {
      console.error("Failed to load barcode:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarcode();
  }, [productId]);

  const handlePrintLabels = () => {
    // Open label sheet PDF in new tab
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
    window.open(`${apiBase}/api/v1/products/${productId}/label-sheet`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="size-5 text-primary-500" />
          <h3 className="font-semibold text-fg">Barcode & QR</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Printer className="size-4" />}
          onClick={handlePrintLabels}
        >
          Print labels
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="size-8 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin" />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Code128 barcode */}
          <div className="p-5 rounded-xl border border-border bg-white text-center space-y-3">
            <p className="text-xs text-fg-muted font-medium uppercase tracking-wide">Code128</p>
            <div
              className="flex justify-center [&>svg]:max-w-full [&>svg]:h-16"
              dangerouslySetInnerHTML={{ __html: data.code128 }}
            />
            <p className="text-sm font-mono text-fg-subtle tracking-wider">{data.barcode_value}</p>
          </div>

          {/* QR Code */}
          <div className="p-5 rounded-xl border border-border bg-white text-center space-y-3">
            <p className="text-xs text-fg-muted font-medium uppercase tracking-wide">QR Code</p>
            <div
              className="flex justify-center [&>svg]:size-24"
              dangerouslySetInnerHTML={{ __html: data.qr }}
            />
            <p className="text-sm font-mono text-fg-subtle tracking-wider">{data.barcode_value}</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-fg-muted text-sm">
          <p>Barcode: <span className="font-mono">{displayValue}</span></p>
        </div>
      )}
    </div>
  );
}
