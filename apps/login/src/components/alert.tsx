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

// shadcn "destructive" and "default" alert variants.
const alert = "border-destructive/30 bg-destructive/10 text-destructive";
const neutral = "border-border bg-muted/40 text-card-foreground [&>svg]:text-muted-foreground";

export function Alert({ children, type = AlertType.ALERT }: Props) {
  return (
    <div
      className={clsx(
        "flex w-full flex-row items-start gap-2.5 border px-4 py-3 text-left text-sm leading-normal",
        getComponentRoundness("card"),
        {
          [alert]: type === AlertType.ALERT,
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
