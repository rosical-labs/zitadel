import { ReactNode } from "react";

/** Design system divider: a short muted label ("veya") between two hairlines. */
export function Divider({ children }: { children: ReactNode }) {
  return (
    <p className="text-muted-foreground before:bg-border after:bg-border flex items-center gap-3 text-xs leading-4 before:h-px before:flex-1 after:h-px after:flex-1">
      {children}
    </p>
  );
}
