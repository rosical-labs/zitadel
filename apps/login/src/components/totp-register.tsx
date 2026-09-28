"use client";

import { completeFlowOrGetUrl } from "@/lib/client";
import { handleServerActionResponse } from "@/lib/client-utils";
import { verifyTOTP } from "@/lib/server/verify";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { Button, ButtonVariants } from "./button";
import { CopyToClipboard } from "./copy-to-clipboard";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  code: string;
};

type Props = {
  uri: string;
  secret: string;
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  checkAfter?: boolean;
  loginSettings?: LoginSettings;
};
export function TotpRegister({ uri, loginName, sessionId, requestId, organization, checkAfter, loginSettings }: Props) {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      code: "",
    },
  });

  const t = useTranslations("otp");

  async function continueWithCode(values: Inputs) {
    setLoading(true);
    return verifyTOTP(values.code, loginName, organization)
      .then(async () => {
        // if attribute is set, validate MFA after it is setup, otherwise proceed as usual (when mfa is enforced to login)
        if (checkAfter) {
          const params = new URLSearchParams({});

          if (loginName) {
            params.append("loginName", loginName);
          }
          if (requestId) {
            params.append("requestId", requestId);
          }
          if (organization) {
            params.append("organization", organization);
          }

          return router.push(`/otp/time-based?` + params);
        } else {
          if (requestId && sessionId) {
            const callbackResponse = await completeFlowOrGetUrl(
              {
                sessionId: sessionId,
                requestId: requestId,
                organization: organization,
              },
              loginSettings?.defaultRedirectUri,
            );

            handleServerActionResponse(callbackResponse, router, setSamlData, setError);
          } else if (loginName) {
            const callbackResponse = await completeFlowOrGetUrl(
              {
                loginName: loginName,
                organization: organization,
              },
              loginSettings?.defaultRedirectUri,
            );

            handleServerActionResponse(callbackResponse, router, setSamlData, setError);
          }
        }
      })
      .catch((e) => {
        setError(e.message);
        return;
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      {uri && (
        <>
          <QRCodeSVG className="border-border size-44 rounded-md border bg-white p-2" value={uri} />
          <div className="border-border bg-muted/40 flex w-full min-w-0 items-center gap-2 rounded-md border py-1 pr-1 pl-3 text-xs">
            <Link
              href={uri}
              target="_blank"
              className="text-muted-foreground hover:text-foreground min-w-0 flex-1 truncate font-mono"
            >
              {uri}
            </Link>

            <CopyToClipboard value={uri}></CopyToClipboard>
          </div>
          <form className="flex w-full flex-col gap-6">
            <div className="">
              <TextInput
                type="text"
                autoFocus
                {...register("code", { required: t("set.required.code") })}
                label={t("set.labels.code")}
                data-testid="code-text-input"
              />
            </div>

            {error && (
              <div>
                <Alert>{error}</Alert>
              </div>
            )}

            <div className="flex w-full flex-row items-center justify-between gap-3">
              <span className="flex-grow"></span>
              <Button
                type="submit"
                className="self-end"
                variant={ButtonVariants.Primary}
                disabled={loading || !formState.isValid}
                onClick={handleSubmit(continueWithCode)}
                data-testid="submit-button"
              >
                {loading && <Spinner className="size-4" />}
                <Translated i18nKey="set.submit" namespace="otp" />
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
