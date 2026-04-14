"use client";

import { useState, useTransition } from "react";
import { ImagePlus, X, Upload, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadProductImage } from "../actions";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  productId: number;
  images: string[];
  readonly?: boolean;
}

export function ImageGallery({ productId, images, readonly = false }: ImageGalleryProps) {
  const [isPending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const storageBase = process.env.NEXT_PUBLIC_API_URL ?? "";

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    startTransition(async () => {
      await uploadProductImage(productId, formData);
    });

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPreview(`${storageBase}/storage/${img}`)}
            className="group relative aspect-square rounded-xl border border-border overflow-hidden bg-surface-muted hover:border-primary-300 transition-all hover:shadow-md"
          >
            <img
              src={`${storageBase}/storage/${img}`}
              alt={`Product image ${i + 1}`}
              className="size-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}

        {/* Upload button */}
        {!readonly && images.length < 5 && (
          <label
            className={cn(
              "aspect-square rounded-xl border-2 border-dashed border-border",
              "flex flex-col items-center justify-center gap-2 cursor-pointer",
              "hover:border-primary-400 hover:bg-primary-50/50 transition-all",
              "text-fg-muted hover:text-primary-600",
              isPending && "opacity-50 pointer-events-none",
            )}
          >
            {isPending ? (
              <Upload className="size-6 animate-pulse" />
            ) : (
              <ImagePlus className="size-6" />
            )}
            <span className="text-xs font-medium">
              {isPending ? "Uploading..." : "Add image"}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleUpload}
              disabled={isPending}
            />
          </label>
        )}
      </div>

      {images.length === 0 && readonly && (
        <div className="flex flex-col items-center justify-center py-8 text-fg-muted">
          <ImageIcon className="size-10 opacity-30 mb-2" />
          <p className="text-sm">No images</p>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setPreview(null)}
        >
          <button
            onClick={() => setPreview(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="size-5" />
          </button>
          <img
            src={preview}
            alt="Product preview"
            className="max-h-[85vh] max-w-[90vw] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
