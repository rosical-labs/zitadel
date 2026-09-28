import { getComponentRoundness } from "@/lib/theme";
import { clsx } from "clsx";
import { ReactNode } from "react";

type BoundaryColor = "default" | "pink" | "blue" | "violet" | "cyan" | "orange" | "red";

// Label text color per boundary color; "red" maps to the destructive token, the rest are decorative.
const labelColors: Record<BoundaryColor, string> = {
  default: "text-muted-foreground",
  pink: "text-pink-600 dark:text-pink-400",
  blue: "text-blue-600 dark:text-blue-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  red: "text-destructive",
  violet: "text-violet-600 dark:text-violet-400",
  orange: "text-orange-600 dark:text-orange-400",
};

/**
 * A card with small uppercase labels above its content, used by the error boundaries.
 * `animateRerendering` is accepted for API compatibility and has no visual effect.
 */
export const Boundary = ({
  children,
  labels = ["children"],
  size = "default",
  color = "default",
}: {
  children: ReactNode;
  labels?: string[];
  size?: "small" | "default";
  color?: BoundaryColor;
  animateRerendering?: boolean;
}) => {
  return (
    <div
      className={clsx("bg-card text-card-foreground w-full border text-left shadow-xs", getComponentRoundness("card"), {
        "p-4": size === "small",
        "p-6 sm:p-8": size === "default",
        "border-border": color !== "red",
        "border-destructive/30": color === "red",
      })}
    >
      <div className={clsx("mb-4 flex gap-2 text-xs font-medium tracking-wider uppercase", labelColors[color])}>
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {children}
    </div>
  );
};
