"use client";

import { handleServerActionResponse } from "@/lib/client-utils";
import { sendLoginname } from "@/lib/server/loginname";
import { clearSession, continueWithSession, ContinueWithSessionCommand } from "@/lib/server/session";
import { XCircleIcon } from "@heroicons/react/24/outline";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Timestamp, timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import moment from "moment";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { Avatar } from "./avatar";
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

  const { valid, verifiedAt } = isSessionPrimaryFactorAndLifetimeValid(session);
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  return (
    <>
      <Tooltip.Root delayDuration={300}>
        {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
        <Tooltip.Trigger asChild>
          <button
            onClick={async () => {
              if (valid && session?.factors?.user) {
                const sessionPayload: ContinueWithSessionCommand = session;
                if (requestId) {
                  sessionPayload.requestId = requestId;
                }

                const callbackResponse = await continueWithSession(sessionPayload);

                handleServerActionResponse(callbackResponse, router, setSamlData, (e) => setError(e));
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
            className="group border-border bg-card hover:bg-accent hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex w-full flex-row items-center gap-3 rounded-md border px-3 py-2.5 text-left shadow-xs transition-colors outline-none focus-visible:ring-[3px]"
          >
            <div className="shrink-0">
              <Avatar
                size="small"
                loginName={session.factors?.user?.loginName as string}
                name={session.factors?.user?.displayName ?? ""}
              />
            </div>

            <div className="flex min-w-0 flex-col items-start">
              <span className="max-w-full truncate text-sm font-medium">{session.factors?.user?.displayName}</span>
              <span className="text-muted-foreground max-w-full truncate text-xs">{session.factors?.user?.loginName}</span>
              {valid ? (
                <span className="text-muted-foreground max-w-full truncate text-xs">
                  <Translated i18nKey="verified" namespace="accounts" />{" "}
                  {verifiedAt && moment(timestampDate(verifiedAt)).fromNow()}
                </span>
              ) : (
                verifiedAt && (
                  <span className="text-muted-foreground max-w-full truncate text-xs">
                    <Translated i18nKey="expired" namespace="accounts" />{" "}
                    {session.expirationDate && moment(timestampDate(session.expirationDate)).fromNow()}
                  </span>
                )
              )}
            </div>

            <span className="flex-grow"></span>
            <div className="relative flex flex-row items-center">
              {valid ? (
                <div className="absolute right-6 mx-2 size-2 rounded-full bg-green-500 transition-all group-hover:right-6 sm:right-0"></div>
              ) : (
                <div className="bg-destructive absolute right-6 mx-2 size-2 rounded-full transition-all group-hover:right-6 sm:right-0"></div>
              )}

              <XCircleIcon
                className="text-muted-foreground hover:text-foreground size-5 transition-colors group-hover:block sm:hidden"
                onClick={async (event: React.MouseEvent) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (await clearSessionId(session.id)) {
                    reload();
                  }
                }}
              />
            </div>
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
      {error && <Alert>{error}</Alert>}
    </>
  );
}
