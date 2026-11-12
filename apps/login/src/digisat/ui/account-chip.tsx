import { Translated } from "@/components/translated";
import Link from "next/link";
import { buttonClasses } from "./button-styles";

// Up to two initials from the name's words, or from the login name's local part ("ali.yildiz@x" → "AY").
// Kept here because avatar.tsx is a client module and the chip renders on the server.
export function accountInitials(name: string): string {
  const base = name.includes("@") && !name.includes(" ") ? name.split("@")[0] : name;
  const words = base.split(/[\s._-]+/).filter((word) => word.length > 0);
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

type Props = {
  /** The display name, or the login name when no display name is known. */
  name: string;
  /** The login name or e-mail; shown under the name unless it repeats it. */
  detail?: string;
  /** Where "Değiştir" goes; no button without it. */
  changeHref?: string;
};

/** Design system account chip: who is signing in, on every step after the login name. */
export function AccountChip({ name, detail, changeHref }: Props) {
  const showDetail = !!detail && detail !== name;

  return (
    <div className="border-border bg-card flex w-full min-w-0 items-center gap-3 rounded-full border p-2">
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs leading-4 font-bold"
      >
        {accountInitials(name)}
      </span>
      <div className="min-w-0 flex-1">
        <b className="block truncate text-sm leading-5 font-semibold">{name}</b>
        {showDetail && <span className="text-muted-foreground block truncate text-xs leading-4">{detail}</span>}
      </div>
      {changeHref && (
        <Link href={changeHref} className={buttonClasses("ghost", "sm")} data-testid="account-change">
          <Translated i18nKey="account.change" namespace="digisat" />
        </Link>
      )}
    </div>
  );
}
