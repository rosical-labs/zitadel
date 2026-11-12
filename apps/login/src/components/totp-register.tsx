"use client";

import { useCompletionView } from "@/digisat/step-override";
import { CodeInput } from "@/digisat/ui/code-input";
import { Field, fieldDescribedBy, fieldLabelClasses } from "@/digisat/ui/field";
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
import { AutoSubmitForm } from "./auto-submit-form";
import { Button, ButtonSizes, ButtonVariants } from "./button";
import { CopyToClipboard } from "./copy-to-clipboard";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

const CODE_FIELD_ID = "code";

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
export function TotpRegister({
  uri,
  secret,
  loginName,
  sessionId,
  requestId,
  organization,
  checkAfter,
  loginSettings,
}: Props) {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);
  const router = useRouter();
  const withCompletionView = useCompletionView(); // digisat: the view after a completed sign-in

  const { register, handleSubmit, formState, watch } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      code: "",
    },
  });
  // digisat: the code boxes draw the current value
  const codeValue = watch("code");

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

            // digisat: handoff, or the no-access step for a user without access
            withCompletionView(callbackResponse, () =>
              handleServerActionResponse(callbackResponse, router, setSamlData, setError),
            );
          } else if (loginName) {
            const callbackResponse = await completeFlowOrGetUrl(
              {
                loginName: loginName,
                organization: organization,
              },
              loginSettings?.defaultRedirectUri,
            );

            // digisat: handoff, or the no-access step for a user without access
            withCompletionView(callbackResponse, () =>
              handleServerActionResponse(callbackResponse, router, setSamlData, setError),
            );
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

  // The submit button's handler; the code boxes call the same one on the sixth digit.
  const submitFromButton = handleSubmit(continueWithCode);

  // digisat: auto-submit a complete code once; not while a check or the redirect is pending
  function submitCompleteCode() {
    if (loading) {
      return;
    }
    void submitFromButton();
  }

  // digisat: step card layout: QR, the secret in mono (a link to the otpauth URI) with copy, six code boxes, one full-width primary
  return (
    <div className="flex w-full flex-col items-center gap-4">
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      {uri && (
        <>
          {/* The QR stays black on white in both themes so authenticator apps can read it. */}
          <QRCodeSVG className="border-border size-44 rounded-lg border bg-white p-2" value={uri} />
          <div className="flex w-full flex-col gap-1.5">
            <span className={fieldLabelClasses}>{t("set.secret")}</span>
            <div className="border-input bg-card flex h-9 w-full min-w-0 items-center gap-2 rounded-sm border pr-0.5 pl-3">
              <Link
                href={uri}
                target="_blank"
                className="text-foreground min-w-0 flex-1 truncate font-mono text-sm tracking-wide underline-offset-4 hover:underline"
                data-testid="totp-secret"
              >
                {secret || uri}
              </Link>
              <CopyToClipboard value={secret || uri}></CopyToClipboard>
            </div>
          </div>
          <form className="flex w-full flex-col gap-4">
            <Field id={CODE_FIELD_ID} label={t("set.labels.code")} error={error} errorTestId="error">
              <CodeInput
                id={CODE_FIELD_ID}
                autoFocus
                autoComplete="one-time-code"
                code={codeValue ?? ""}
                invalid={!!error}
                aria-describedby={fieldDescribedBy(CODE_FIELD_ID, { error })}
                onComplete={submitCompleteCode}
                {...register("code", { required: t("set.required.code") })}
                data-testid="code-text-input"
              />
            </Field>

            <div className="flex w-full flex-col">
              <Button
                type="submit"
                size={ButtonSizes.Large}
                variant={ButtonVariants.Primary}
                disabled={loading || !formState.isValid}
                onClick={submitFromButton}
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
