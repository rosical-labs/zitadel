import { AccountChip } from "@/digisat/ui/account-chip";

type Props = {
  loginName?: string;
  displayName?: string;
  showDropdown: boolean;
  searchParams?: Record<string | number | symbol, string | undefined>;
};

export function UserAvatar({ loginName, displayName, showDropdown, searchParams }: Props) {
  const params = new URLSearchParams({});

  if (searchParams?.sessionId) {
    params.set("sessionId", searchParams.sessionId);
  }

  if (searchParams?.organization) {
    params.set("organization", searchParams.organization);
  }

  if (searchParams?.requestId) {
    params.set("requestId", searchParams.requestId);
  }

  if (searchParams?.loginName) {
    params.set("loginName", searchParams.loginName);
  }

  // digisat: the design system account chip; "Değiştir" goes where the account dropdown link went
  return (
    <AccountChip
      name={displayName || loginName || ""}
      detail={loginName}
      changeHref={showDropdown ? "/accounts?" + params : undefined}
    />
  );
}
