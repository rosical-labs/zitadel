"use client";

import { useCompletionView } from "@/digisat/step-override";
import { Badge } from "@/digisat/ui/badge";
import { buttonClasses } from "@/digisat/ui/button-styles";
import { InitialsAvatar } from "@/digisat/ui/initials-avatar";
import { handleServerActionResponse } from "@/lib/client-utils";
import { sendLoginname } from "@/lib/server/loginname";
import { clearSession, continueWithSession, ContinueWithSessionCommand } from "@/lib/server/session";
import { XMarkIcon } from "@heroicons/react/24/outline";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Timestamp, timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { clsx } from "clsx";
import { ChevronRightIcon } from "lucide-react";
import moment from "moment";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { Translated } from "./translated";

export function isSessionPrimaryFactorAndLifetimeValid(session: Partial<Session>): {
  valid: boolean;
  verifiedAt?: Timestamp;
} {
  const validPassword = session?.factors?.password?.verifiedAt;
  const validPasskey = session?.factors?.webAuthN?.verifiedAt;
  const validIDP = session?.factors?.intent?.verifiedAt;

  const stillValid = session.expirationDate ? timestampDate(session.expirationDate) > new Date() : true;

  const verifiedAt = validPassword || validPasskey || validIDP;
  const valid = !!((validPassword || validPasskey || validIDP) && stillValid);

  return { valid, verifiedAt };
}

export function SessionItem({ session, reload, requestId }: { session: Session; reload: () => void; requestId?: string }) {
  const currentLocale = useLocale();
  moment.locale(currentLocale === "zh" ? "zh-cn" : currentLocale);
  const t = useTranslations("error");
  const tAccounts = useTranslations("accounts");

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
  const loginName = session.factors?.user?.loginName ?? "";
  const name = session.factors?.user?.displayName || loginName;
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const withCompletionView = useCompletionView(); // digisat: the view after a completed sign-in

  // digisat: design system account picker row (avatar, name, login name; a badge when the session cannot continue).
  // The remove control is its own button next to the row instead of an icon inside it.
  return (
    <div className="group">
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <div className="hover:bg-accent focus-within:bg-accent flex items-center transition-colors">
        <Tooltip.Root delayDuration={300}>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              onClick={async () => {
                if (valid && session?.factors?.user) {
                  const sessionPayload: ContinueWithSessionCommand = session;
                  if (requestId) {
                    sessionPayload.requestId = requestId;
                  }

                  const callbackResponse = await continueWithSession(sessionPayload);

                  // digisat: handoff, or the no-access step for a user without access
                  withCompletionView(callbackResponse, () =>
                    handleServerActionResponse(callbackResponse, router, setSamlData, (e) => setError(e)),
                  );
                } else if (session.factors?.user) {
                  setLoading(true);
                  try {
                    const res = await sendLoginname({
                      loginName: session.factors?.user?.loginName,
                      organization: session.factors.user.organizationId,
                      requestId: requestId,
                    });

                    handleServerActionResponse(res, router, setSamlData, (e) => setError(e));
                  } catch {
                    setError("An internal error occurred");
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              className="focus-visible:outline-ring flex min-h-14 min-w-0 flex-1 items-center gap-3 py-3 pr-2 pl-4 text-left text-sm outline-none focus-visible:outline-2 focus-visible:-outline-offset-2"
            >
              <InitialsAvatar name={name} muted={!valid} />
              <div className="min-w-0 flex-1">
                <b className="block truncate leading-5 font-semibold">{name}</b>
                {name !== loginName && (
                  <span className="text-muted-foreground block truncate text-xs leading-4">{loginName}</span>
                )}
              </div>
              {valid ? (
                <ChevronRightIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
              ) : (
                <Badge>
                  <Translated i18nKey="sessionEnded" namespace="accounts" />
                </Badge>
              )}
            </button>
          </Tooltip.Trigger>
          {valid && session.expirationDate && (
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-popover text-popover-foreground border-border z-50 rounded-md border px-3 py-1.5 text-xs shadow-md select-none"
                sideOffset={5}
              >
                Expires {moment(timestampDate(session.expirationDate)).fromNow()}
                <Tooltip.Arrow className="fill-popover" />
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
        <button
          type="button"
          aria-label={tAccounts("remove", { name })}
          className={clsx(
            buttonClasses("ghost", "icon"),
            "mr-2 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
          )}
          onClick={async () => {
            if (await clearSessionId(session.id)) {
              reload();
            }
          }}
        >
          <XMarkIcon className="text-muted-foreground size-4" aria-hidden="true" />
        </button>
      </div>
      {error && (
        <div className="px-4 pb-3">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
