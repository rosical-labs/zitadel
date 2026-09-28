"use client";

import { approveDeviceAuthorization, denyDeviceAuthorization } from "@/lib/server/device";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "./alert";
import { Button, ButtonVariants } from "./button";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

export function ConsentScreen({
  scope,
  userCode,
  sessionId,
  organization,
  appName,
}: {
  scope?: string[];
  userCode: string;
  sessionId: string;
  organization?: string;
  appName?: string;
}) {
  const t = useTranslations();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  async function run(action: () => Promise<unknown>, onSuccess: (response: { redirect?: string }) => void) {
    setLoading(true);
    const response = (await action()
      .catch(() => ({ error: "Could not complete the request" }))
      .finally(() => {
        setLoading(false);
      })) as { error?: string; redirect?: string };

    if (response?.error) {
      setError(response.error);
      return;
    }

    onSuccess(response);
  }

  const scopes = scope?.filter((s) => !!s);

  return (
    <div className="flex w-full flex-col gap-6">
      <ul className="flex w-full flex-col gap-2">
        {scopes?.length === 0 && (
          <span className="border-border bg-muted/40 flex w-full flex-row items-center rounded-md border px-3 py-2 text-sm">
            <Translated i18nKey="scope.openid" namespace="device" />
          </span>
        )}
        {scopes?.map((s) => {
          const translationKey = `device.scope.${s}`;
          const description = t(translationKey);

          // Check if the key itself is returned and provide a fallback
          const resolvedDescription = description === translationKey ? "" : description;

          return (
            <li
              key={s}
              className="border-border bg-muted/40 flex w-full flex-row items-center rounded-md border px-3 py-2 text-sm"
            >
              <span>{resolvedDescription}</span>
            </li>
          );
        })}
      </ul>

      {/* RFC 8628 5.4: show the user code so the user can compare it with the one on the device */}
      <p className="ztdl-p w-full text-left text-sm">
        <Translated i18nKey="request.usercode" namespace="device" />{" "}
        <span className="font-mono font-bold" data-testid="user-code">
          {userCode}
        </span>
      </p>

      <p className="ztdl-p text-left text-xs">
        <Translated i18nKey="request.disclaimer" namespace="device" data={{ appName: appName }} />
      </p>

      {error && (
        <div>
          <Alert>{error}</Alert>
        </div>
      )}

      <div className="flex w-full flex-row items-center justify-between gap-3">
        <Button
          onClick={() =>
            run(
              () => denyDeviceAuthorization({ userCode, sessionId, organization }),
              (response) => router.push(response.redirect ?? "/device"),
            )
          }
          variant={ButtonVariants.Secondary}
          data-testid="deny-button"
        >
          {loading && <Spinner className="size-4" />}
          <Translated i18nKey="request.deny" namespace="device" />
        </Button>
        <span className="flex-grow"></span>

        <Button
          onClick={() =>
            run(
              () => approveDeviceAuthorization({ userCode, sessionId, organization }),
              (response) => response.redirect && router.push(response.redirect),
            )
          }
          disabled={loading}
          data-testid="submit-button"
          className="self-end"
          variant={ButtonVariants.Primary}
        >
          {loading && <Spinner className="size-4" />}
          <Translated i18nKey="request.submit" namespace="device" />
        </Button>
      </div>
    </div>
  );
}
