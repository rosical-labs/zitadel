import { getComponentRoundness, getThemeConfig, SPACING_STYLES } from "@/lib/theme";
import { ThemeableProps } from "@/lib/themeUtils";
import { clsx } from "clsx";

interface SkeletonCardProps extends ThemeableProps {
  isLoading?: boolean;
}

// Helper function to get default card roundness from theme
function getDefaultCardRoundness(): string {
  return getComponentRoundness("card");
}

// Helper function to get default spacing from centralized theme system
function getDefaultSpacing(): string {
  const themeConfig = getThemeConfig();
  return SPACING_STYLES[themeConfig.spacing].spacing;
}

// Helper function to get default padding from centralized theme system
function getDefaultPadding(): string {
  const themeConfig = getThemeConfig();
  return SPACING_STYLES[themeConfig.spacing].padding;
}
export const SkeletonCard = ({
  isLoading,
  roundness, // Will use theme default if not provided
  spacing, // Will use theme default if not provided
  padding, // Will use theme default if not provided
}: SkeletonCardProps) => {
  // Use theme-based values if not explicitly provided
  const actualRoundness = roundness || getDefaultCardRoundness();
  const actualSpacing = spacing || getDefaultSpacing();
  const actualPadding = padding || getDefaultPadding();

  return (
    <div
      className={clsx(
        "bg-card border-border border shadow-xs",
        actualPadding,
        {
          "before:via-foreground/5 relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:to-transparent":
            isLoading,
        },
        actualRoundness, // Apply the full roundness classes directly
      )}
    >
      <div className={actualSpacing}>
        <div className="space-y-2">
          <div className={clsx("bg-muted h-5 w-1/2", actualRoundness.split(" ")[0])} />
          <div className={clsx("bg-muted h-3.5 w-3/4", actualRoundness.split(" ")[0])} />
        </div>
        <div className="space-y-2">
          <div className={clsx("bg-muted h-3.5 w-1/4", actualRoundness.split(" ")[0])} />
          <div className={clsx("bg-muted h-9", actualRoundness.split(" ")[0])} />
        </div>
        <div className="flex justify-between">
          <div className={clsx("bg-muted h-9 w-20", actualRoundness.split(" ")[0])} />
          <div className={clsx("bg-muted h-9 w-24", actualRoundness.split(" ")[0])} />
        </div>
      </div>
    </div>
  );
};
