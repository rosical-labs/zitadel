"use client";

import { createContext, ReactNode, useContext } from "react";
import type { Product } from "./products";

const ProductContext = createContext<Product | undefined>(undefined);

// Passes the product resolved by the root layout to client components; undefined means the hub.
export function ProductProvider({ product, children }: { product: Product | undefined; children: ReactNode }) {
  return <ProductContext.Provider value={product}>{children}</ProductContext.Provider>;
}

export function useProduct(): Product | undefined {
  return useContext(ProductContext);
}
