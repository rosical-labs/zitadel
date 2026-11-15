"use client";

import { createContext, ReactNode, useContext } from "react";

// true = the digisat look. The root layout always provides the host decision; the default only applies to
// components rendered without the layout (unit tests), which test the digisat look.
const DigisatHostContext = createContext<boolean>(true);

// Passes the root layout's isDigisatHost decision (DIGISAT_HOSTS is server-only) to client components.
export function DigisatHostProvider({ digisat, children }: { digisat: boolean; children: ReactNode }) {
  return <DigisatHostContext.Provider value={digisat}>{children}</DigisatHostContext.Provider>;
}

export function useIsDigisatHost(): boolean {
  return useContext(DigisatHostContext);
}
