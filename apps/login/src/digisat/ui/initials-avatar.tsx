import { clsx } from "clsx";
import { accountInitials } from "./account-chip";

/** Design system avatar (32px, ink); `muted` for accounts that cannot continue without signing in again. */
export function InitialsAvatar({ name, muted = false }: { name: string; muted?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs leading-4 font-bold",
        muted ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground",
      )}
    >
      {accountInitials(name)}
    </span>
  );
}
