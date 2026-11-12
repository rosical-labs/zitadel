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

// digisat: design system Banner (danger / info surfaces, icon in the status colour) for form-level messages.
const alert = "bg-danger-surface text-foreground [&>svg]:text-destructive";
const neutral = "bg-info-surface text-foreground [&>svg]:text-info";

export function Alert({ children, type = AlertType.ALERT }: Props) {
  return (
    <div
      // digisat: announce errors at once and info politely (design system: errors are announced)
      role={type === AlertType.ALERT ? "alert" : "status"}
      className={clsx(
        // digisat: design system Banner metrics (12px 16px, 500 14px/20px, radius)
        "flex w-full flex-row items-start gap-3 rounded-lg px-4 py-3 text-left text-sm leading-5 font-medium",
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
