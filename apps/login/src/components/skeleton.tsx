import { ReactNode } from "react";

// digisat: a muted design system block; theme roundness no longer applies.
export function Skeleton({ children }: { children?: ReactNode }) {
  return (
    <div className="bg-muted flex animate-pulse flex-row items-center justify-center rounded-lg px-8 py-12 motion-reduce:animate-none">
      {children}
    </div>
  );
}
