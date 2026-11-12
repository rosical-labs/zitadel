"use client";

import { sessionListClasses } from "@/digisat/ui/list-styles";
import { approveDeviceAuthorization, denyDeviceAuthorization } from "@/lib/server/device";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "./alert";
import { Button, ButtonSizes, ButtonVariants } from "./button";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

// digisat: a scope as a compact, non-interactive list row
const scopeRowClasses = "flex w-full items-center px-4 py-2.5 text-sm";

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

  // digisat: step card layout: the scopes as a design system list, the user code in mono, one full-width primary, deny as outline
  return (
    <div className="flex w-full flex-col gap-4">
      <ul className={sessionListClasses}>
        {scopes?.length === 0 && (
          <li className={scopeRowClasses}>
            <Translated i18nKey="scope.openid" namespace="device" />
          </li>
        )}
        {scopes?.map((s) => {
          const translationKey = `device.scope.${s}`;
          const description = t(translationKey);

          // Check if the key itself is returned and provide a fallback
          const resolvedDescription = description === translationKey ? "" : description;

          return (
            <li key={s} className={scopeRowClasses}>
              <span>{resolvedDescription}</span>
            </li>
          );
        })}
      </ul>

      {/* RFC 8628 5.4: show the user code so the user can compare it with the one on the device */}
      <p className="ztdl-p w-full text-left text-sm">
        <Translated i18nKey="request.usercode" namespace="device" />{" "}
        <span
          className="bg-secondary text-foreground rounded-[6px] px-1.5 py-0.5 font-mono font-medium"
          data-testid="user-code"
        >
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

      <div className="flex w-full flex-col gap-2">
        <Button
          onClick={() =>
            run(
              () => approveDeviceAuthorization({ userCode, sessionId, organization }),
              (response) => response.redirect && router.push(response.redirect),
            )
          }
          disabled={loading}
          data-testid="submit-button"
          size={ButtonSizes.Large}
          variant={ButtonVariants.Primary}
        >
          {loading && <Spinner className="size-4" />}
          <Translated i18nKey="request.submit" namespace="device" />
        </Button>
        <Button
          onClick={() =>
            run(
              () => denyDeviceAuthorization({ userCode, sessionId, organization }),
              (response) => router.push(response.redirect ?? "/device"),
            )
          }
          size={ButtonSizes.Large}
          variant={ButtonVariants.Secondary}
          data-testid="deny-button"
        >
          {loading && <Spinner className="size-4" />}
          <Translated i18nKey="request.deny" namespace="device" />
        </Button>
      </div>
    </div>
  );
}
