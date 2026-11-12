import { ThemeableProps } from "@/lib/themeUtils";
import { clsx } from "clsx";

interface SkeletonCardProps extends ThemeableProps {
  isLoading?: boolean;
}

// digisat: the loading state is the step card's outline (title, description, one field, the primary pill) in muted
// blocks on the frameless column; theme roundness, spacing and padding no longer apply.
const block = "bg-muted rounded-sm";

export const SkeletonCard = ({ isLoading }: SkeletonCardProps) => {
  return (
    <div
      aria-hidden="true"
      className={clsx("flex w-full flex-col gap-6", isLoading && "animate-pulse motion-reduce:animate-none")}
    >
      <div className="flex flex-col gap-2">
        <div className={clsx(block, "h-7 w-1/2")} />
        <div className={clsx(block, "h-4 w-3/4")} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className={clsx(block, "h-[18px] w-1/4")} />
          <div className={clsx(block, "h-9")} />
        </div>
        <div className="bg-muted h-10 rounded-full" />
      </div>
    </div>
  );
};
