import { getComponentRoundness } from "@/lib/theme";
import { ExclamationTriangleIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { clsx } from "clsx";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  type?: AlertType;
};

export enum AlertType {
  ALERT,
  INFO,
}

const warning = "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
const neutral = "border-border bg-card text-card-foreground";

export function Alert({ children, type = AlertType.ALERT }: Props) {
  return (
    <div
      className={clsx(
        "flex w-full scroll-px-40 flex-row items-start gap-2.5 border px-4 py-3 text-left text-sm",
        getComponentRoundness("card"),
        {
          [warning]: type === AlertType.ALERT,
          [neutral]: type === AlertType.INFO,
        },
      )}
    >
      {type === AlertType.ALERT && <ExclamationTriangleIcon className="size-4 shrink-0 translate-y-0.5" />}
      {type === AlertType.INFO && <InformationCircleIcon className="size-4 shrink-0 translate-y-0.5" />}
      <span className="w-full text-sm">{children}</span>
    </div>
  );
}
