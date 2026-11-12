import { clsx } from "clsx";
import { ReactNode } from "react";

// Design system Badge (.dg-badge): 22px, 6px radius, 500 12px; status variants use the status surfaces.
export type BadgeVariant = "default" | "outline" | "success" | "warning" | "danger" | "info";

const VARIANTS: Record<BadgeVariant, string> = {
  default: "bg-secondary text-secondary-foreground",
  outline: "border border-border bg-transparent text-foreground",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-destructive",
  info: "bg-info-surface text-info",
};

export function badgeClasses(variant: BadgeVariant = "default"): string {
  return clsx(
    "inline-flex h-[22px] w-fit shrink-0 items-center gap-1.5 rounded-[6px] px-2 text-xs leading-4 font-medium whitespace-nowrap",
    VARIANTS[variant],
  );
}

export function Badge({ variant = "default", children }: { variant?: BadgeVariant; children: ReactNode }) {
  return <span className={badgeClasses(variant)}>{children}</span>;
}
