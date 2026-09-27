import { APPEARANCE_STYLES, getComponentRoundness, getThemeConfig } from "@/lib/theme";
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

// Helper function to get default button roundness from theme
function getDefaultButtonRoundness(): string {
  return getComponentRoundness("button");
}

// Helper function to get default button appearance from centralized theme system
function getDefaultButtonAppearance(): string {
  const themeConfig = getThemeConfig();
  const appearance = APPEARANCE_STYLES[themeConfig.appearance];
  return appearance?.button || APPEARANCE_STYLES.flat.button; // Fallback to flat design
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = ButtonVariants.Primary,
      size = ButtonSizes.Small,
      color = ButtonColors.Primary,
      roundness, // Will use theme default if not provided
      ...props
    },
    ref,
  ) => {
    // Use theme-based values if not explicitly provided
    const actualRoundness = roundness || getDefaultButtonRoundness();
    const actualAppearance = getDefaultButtonAppearance();

    return (
      <button
        type="button"
        ref={ref}
        className={`${getButtonClasses(size, variant, color, actualRoundness, actualAppearance)} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);
