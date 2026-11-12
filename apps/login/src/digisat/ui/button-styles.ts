import { clsx } from "clsx";

// Design system Button: pill, 600 14px, ink primary; product colour is never a button colour on the login.
export type ButtonVariant = "primary" | "outline" | "ghost" | "destructive";

// sm 32px (inline actions such as the account chip), md 36px (the DS default), lg 40px (step-card actions),
// icon a 32px square for an icon-only action (it needs an aria-label).
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border-input bg-transparent text-foreground hover:bg-accent",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-accent",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] leading-[18px]",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-4 text-sm",
  icon: "size-8",
};

export function buttonClasses(variant: ButtonVariant, size: ButtonSize = "md"): string {
  return clsx(BASE, VARIANTS[variant], SIZES[size]);
}
