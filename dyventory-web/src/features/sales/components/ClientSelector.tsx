"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { User, Search, X, ChevronDown } from "lucide-react";
import { clientAuthFetch } from "@/lib/client-auth";
import { useSaleStore } from "@/stores/useSaleStore";
import { cn } from "@/lib/utils";
import type { Client, PaginatedResponse } from "@/types";

export function ClientSelector() {
  const t = useTranslations("sales");
  const clientId = useSaleStore((s) => s.clientId);
  const setClientId = useSaleStore((s) => s.setClientId);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await clientAuthFetch<PaginatedResponse<Client>>(
        `/clients?search=${encodeURIComponent(q)}&per_page=6&is_active=1`,
      );
      setResults(res.data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  // Load initial clients on mount
  useEffect(() => {
    search("");
  }, [search]);

  const handleSelect = (client: Client) => {
    setSelectedClient(client);
    setClientId(client.id);
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    setSelectedClient(null);
    setClientId(null);
    setQuery("");
  };

  if (selectedClient) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface-hover">
        <div className="size-9 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <User className="size-4 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg truncate">{selectedClient.name}</p>
          <p className="text-xs text-fg-muted">
            {selectedClient.email ?? selectedClient.phone ?? "No contact info"}
          </p>
        </div>
        <button
          onClick={handleClear}
          className="p-1 rounded text-fg-muted hover:text-danger-600 hover:bg-danger-50 transition-colors shrink-0"
          aria-label="Remove client"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "w-full flex items-center gap-2 px-3 h-10 rounded-lg border text-sm transition-colors text-left",
          isOpen
            ? "border-primary-500 bg-surface-card"
            : "border-border bg-surface-card hover:border-border-strong",
        )}
      >
        <User className="size-4 text-fg-muted shrink-0" />
        <span className="flex-1 text-fg-muted">{t("new.client_placeholder")}</span>
        <ChevronDown className="size-4 text-fg-muted shrink-0" />
      </button>

      {isOpen && (
        <div
          className="absolute z-20 top-full mt-1.5 w-full bg-surface-card border border-border rounded-xl shadow-lg overflow-hidden"
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        >
          {/* Search within dropdown */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-muted pointer-events-none" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search clients…"
                className="input pl-8 h-8 text-sm w-full"
              />
            </div>
          </div>

          {/* Anonymous option */}
          <button
            type="button"
            onMouseDown={() => {
              setSelectedClient(null);
              setClientId(null);
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors text-sm text-fg-muted border-b border-border"
          >
            <User className="size-4" />
            {t("new.no_client")}
          </button>

          {/* Client list */}
          <ul className="max-h-52 overflow-y-auto scrollbar-thin">
            {loading ? (
              <li className="px-4 py-3 text-sm text-fg-muted">Loading…</li>
            ) : results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-fg-muted">No clients found.</li>
            ) : (
              results.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(client)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-hover transition-colors text-left"
                  >
                    <div className="size-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                      <User className="size-3.5 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-fg truncate">
                        {client.name}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {client.email ?? client.phone ?? "—"}
                      </p>
                    </div>
                    {parseFloat(client.outstanding_balance) > 0 && (
                      <span className="text-xs text-warning-600 tabular-nums shrink-0">
                        {parseFloat(client.outstanding_balance).toLocaleString("fr-FR")} F
                      </span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
