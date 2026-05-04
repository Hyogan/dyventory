"use client";

import { createContext, useContext, useTransition } from "react";

interface LoadingContextValue {
  isPending: boolean;
  startTransition: (fn: () => void) => void;
}

const ProductsLoadingContext = createContext<LoadingContextValue>({
  isPending: false,
  startTransition: (fn) => fn(),
});

export function ProductsLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <ProductsLoadingContext.Provider value={{ isPending, startTransition }}>
      {children}
    </ProductsLoadingContext.Provider>
  );
}

export const useProductsLoading = () => useContext(ProductsLoadingContext);
