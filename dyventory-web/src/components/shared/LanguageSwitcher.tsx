"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const locales = [
  { code: "en", label: "EN", name: "English" },
  { code: "fr", label: "FR", name: "Français" },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Replace current locale prefix in path
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1 p-1 rounded-md bg-(--surface-muted)">
      <Globe className="size-3.5 text-(--text-muted) ml-1 shrink-0" />
      {locales.map((l) => (
        <button
          key={l.code}
          onClick={() => switchLocale(l.code)}
          title={l.name}
          className={cn(
            "px-2 py-0.5 text-xs font-medium rounded transition-colors",
            locale === l.code
              ? "bg-white text-(--text-primary) shadow-xs"
              : "text-(--text-muted) hover:text-(--text-primary)",
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
