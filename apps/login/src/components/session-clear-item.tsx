"use client";

import { Badge, badgeClasses } from "@/digisat/ui/badge";
import { InitialsAvatar } from "@/digisat/ui/initials-avatar";
import { sessionRowClasses } from "@/digisat/ui/list-styles";
import { clearSession } from "@/lib/server/session";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { clsx } from "clsx";
import moment from "moment";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "./alert";
import { isSessionPrimaryFactorAndLifetimeValid } from "./session-item";
import { Translated } from "./translated";

export function SessionClearItem({ session, reload }: { session: Session; reload: () => void }) {
  const currentLocale = useLocale();
  moment.locale(currentLocale === "zh" ? "zh-cn" : currentLocale);
  const t = useTranslations("error");

  const [_loading, setLoading] = useState<boolean>(false);

  /**
   * Returns true when the session was removed (server-side and from the cookie).
   * On failure the error is shown and the card must stay in the list.
   */
  async function clearSessionId(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const response = await clearSession({ sessionId: id });
      if (response && "error" in response && response.error) {
        setError(response.error);
        return false;
      }
      return true;
    } catch {
      setError(t("couldNotClearSession"));
      return false;
    } finally {
      setLoading(false);
    }
  }

  const { valid } = isSessionPrimaryFactorAndLifetimeValid(session);

  const [error, setError] = useState<string | null>(null);

  // TODO: To we have to call this?
  useRouter();

  const loginName = session.factors?.user?.loginName ?? "";
  const name = session.factors?.user?.displayName || loginName;

  // digisat: design system session row (avatar, name, login name); "end session" shows on hover/focus, an ended
  // session carries a badge instead
  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          if (await clearSessionId(session.id)) {
            reload();
          }
        }}
        className={clsx(sessionRowClasses, "group text-left")}
      >
        <InitialsAvatar name={name} muted={!valid} />
        <div className="min-w-0 flex-1">
          <b className="block truncate leading-5 font-semibold">{name}</b>
          {name !== loginName && <span className="text-muted-foreground block truncate text-xs leading-4">{loginName}</span>}
        </div>
        {valid ? (
          <span
            className={clsx(
              badgeClasses("danger"),
              "sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100",
            )}
          >
            <Translated i18nKey="clear" namespace="logout" />
          </span>
        ) : (
          <Badge>
            <Translated i18nKey="sessionEnded" namespace="accounts" />
          </Badge>
        )}
      </button>
      {error && (
        <div className="px-4 pb-3">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
