import { Avatar } from "@/components/avatar";
import { getComponentRoundness } from "@/lib/theme";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Helper function to get user avatar container roundness from theme
function getUserAvatarRoundness(): string {
  return getComponentRoundness("avatarContainer");
}

type Props = {
  loginName?: string;
  displayName?: string;
  showDropdown: boolean;
  searchParams?: Record<string | number | symbol, string | undefined>;
};

export function UserAvatar({ loginName, displayName, showDropdown, searchParams }: Props) {
  const params = new URLSearchParams({});
  const userAvatarRoundness = getUserAvatarRoundness();

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

  return (
    <div
      className={`border-border bg-card dark:bg-input/30 flex h-11 w-full min-w-0 flex-row items-center gap-3 border p-1.5 shadow-xs ${userAvatarRoundness}`}
    >
      <div className="shrink-0">
        <Avatar size="small" name={displayName ?? loginName ?? ""} loginName={loginName ?? ""} />
      </div>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{loginName}</span>
      {showDropdown && (
        <Link
          href={"/accounts?" + params}
          className={`text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 flex size-8 shrink-0 items-center justify-center transition-colors outline-none focus-visible:ring-[3px] ${userAvatarRoundness}`}
        >
          <ChevronDownIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
