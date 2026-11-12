import { Badge, BadgeVariant } from "@/digisat/ui/badge";
import { ReactNode } from "react";

export enum BadgeState {
  Info = "info",
  Error = "error",
  Success = "success",
  Alert = "alert",
}

export type StateBadgeProps = {
  state: BadgeState;
  children: ReactNode;
  evenPadding?: boolean;
};

// digisat: the state badge is the design system Badge; the legacy state-* colours and even padding are gone.
const VARIANT_BY_STATE: Record<BadgeState, BadgeVariant> = {
  [BadgeState.Success]: "success",
  [BadgeState.Info]: "default",
  [BadgeState.Error]: "danger",
  [BadgeState.Alert]: "warning",
};

export function StateBadge({ state = BadgeState.Success, children }: StateBadgeProps) {
  return <Badge variant={VARIANT_BY_STATE[state]}>{children}</Badge>;
}
