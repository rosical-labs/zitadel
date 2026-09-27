import { getComponentRoundness } from "@/lib/theme";
import { clsx } from "clsx";
import { ReactNode } from "react";

export function Skeleton({ children }: { children?: ReactNode }) {
  return (
    <div
      className={clsx(
        "bg-muted flex animate-pulse flex-row items-center justify-center px-8 py-12",
        getComponentRoundness("card"),
      )}
    >
      {children}
    </div>
  );
}
