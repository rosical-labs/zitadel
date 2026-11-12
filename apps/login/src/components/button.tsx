import { buttonClasses } from "@/digisat/ui/button-styles";
import { ThemeableProps } from "@/lib/themeUtils";
import { clsx } from "clsx";
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react";

export enum ButtonSizes {
  Small = "Small",
  Large = "Large",
}

export enum ButtonVariants {
  Primary = "Primary",
  Secondary = "Secondary",
  Destructive = "Destructive",
}

export enum ButtonColors {
  Neutral = "Neutral",
  Primary = "Primary",
  Warn = "Warn",
}

export type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  size?: ButtonSizes;
  variant?: ButtonVariants;
  color?: ButtonColors;
} & ThemeableProps;

export const getButtonClasses = (
  size: ButtonSizes,
  variant: ButtonVariants,
  color: ButtonColors,
  roundnessClasses: string = "rounded-md", // Default fallback
  appearance: string = "", // Theme appearance (shadows, borders, etc.)
) =>
  clsx(
    {
      "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap border text-sm font-medium transition-all outline-none select-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0": true,
      "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-ring/50":
        variant === ButtonVariants.Primary && color !== ButtonColors.Warn,
      "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40":
        variant === ButtonVariants.Primary && color === ButtonColors.Warn,
      "border-input bg-background dark:bg-input/30": variant !== ButtonVariants.Primary,
      "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:hover:bg-input/50":
        variant !== ButtonVariants.Primary && color !== ButtonColors.Warn,
      "text-destructive hover:bg-destructive/10 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:hover:bg-destructive/20 dark:focus-visible:ring-destructive/40":
        color === ButtonColors.Warn && variant !== ButtonVariants.Primary,
      "h-10 px-6": size === ButtonSizes.Large,
      "h-9 px-4": size === ButtonSizes.Small,
    },
    roundnessClasses, // Apply the full roundness classes directly
    appearance, // Apply appearance-specific styling (shadows, borders, etc.)
  );

// digisat: buttons are the design system's pills (src/digisat/ui/button-styles.ts), not the theme's roundness and appearance.
function digisatButtonClasses(size: ButtonSizes, variant: ButtonVariants, color: ButtonColors): string {
  const dgSize = size === ButtonSizes.Large ? "lg" : "md";
  if (variant === ButtonVariants.Primary) {
    return buttonClasses(color === ButtonColors.Warn ? "destructive" : "primary", dgSize);
  }
  return buttonClasses("outline", dgSize);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = ButtonVariants.Primary,
      size = ButtonSizes.Small,
      color = ButtonColors.Primary,
      roundness, // digisat: overrides the pill only when passed explicitly
      ...props
    },
    ref,
  ) => {
    return (
      <button
        type="button"
        ref={ref}
        className={clsx(digisatButtonClasses(size, variant, color), roundness, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);
