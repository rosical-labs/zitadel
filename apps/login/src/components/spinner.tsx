import { Loader2Icon } from "lucide-react";
import { FC } from "react";

export const Spinner: FC<{ className?: string }> = ({ className = "" }) => {
  return <Loader2Icon role="status" aria-label="Loading" className={`${className} inline-block animate-spin`} />;
};
