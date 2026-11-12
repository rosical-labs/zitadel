"use client";

import { useCompletionView } from "@/digisat/step-override";
import { Field, fieldDescribedBy, Input } from "@/digisat/ui/field";
import { handleServerActionResponse } from "@/lib/client-utils";
import { resetPassword, sendPassword } from "@/lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertType } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonSizes, ButtonVariants } from "./button";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  password: string;
};

const PASSWORD_FIELD_ID = "password";

type Props = {
  loginSettings: LoginSettings | undefined;
  loginName: string;
  organization?: string;
  defaultOrganization?: string;
  requestId?: string;
};

export function PasswordForm({ loginSettings, loginName, organization, defaultOrganization, requestId }: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
  });

  const t = useTranslations("password");

  const [info, setInfo] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();
  const withCompletionView = useCompletionView(); // digisat: the view after a completed sign-in

  async function submitPassword(values: Inputs) {
    setError("");
    setLoading(true);

    try {
      const response = await sendPassword({
        loginName,
        organization,
        defaultOrganization,
        checks: create(ChecksSchema, {
          password: { password: values.password },
        }),
        requestId,
      });

      // digisat: handoff, or the no-access step for a user without access
      withCompletionView(response, () => handleServerActionResponse(response, router, setSamlData, setError));
    } catch {
      setError(t("verify.errors.couldNotVerifyPassword"));
    } finally {
      setLoading(false);
    }
  }

  async function resetPasswordAndContinue() {
    setError("");
    setInfo("");
    setLoading(true);

    const response = await resetPassword({
      loginName,
      organization,
      defaultOrganization,
      requestId,
    })
      .catch(() => {
        setError(t("errors.couldNotSendResetLink"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response) {
      setError(response.error as string);
      return;
    }

    setInfo(t("verify.info.passwordResetSent"));

    const params = new URLSearchParams({
      loginName: loginName,
    });

    if (organization) {
      params.append("organization", organization);
    }

    if (requestId) {
      params.append("requestId", requestId);
    }

    return router.push("/password/set?" + params);
  }

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      {/* digisat: step card layout: field with "Şifremi unuttum" at the label's right and the error under it, one full-width primary, "Geri" as ghost */}
      <form className="flex w-full flex-col gap-4">
        <div className={`flex flex-col gap-3 ${error ? "animate-shake transform-gpu" : ""}`}>
          <Field
            id={PASSWORD_FIELD_ID}
            label={t("verify.labels.password")}
            labelAside={
              !loginSettings?.hidePasswordReset && (
                <button
                  className="ztdl-link text-[13px] leading-[18px]"
                  onClick={() => resetPasswordAndContinue()}
                  type="button"
                  disabled={loading}
                  data-testid="reset-button"
                >
                  <Translated i18nKey="verify.resetPassword" namespace="password" />
                </button>
              )
            }
            error={error}
            errorTestId="error"
          >
            <Input
              id={PASSWORD_FIELD_ID}
              type="password"
              autoComplete="current-password"
              autoFocus
              invalid={!!error}
              aria-describedby={fieldDescribedBy(PASSWORD_FIELD_ID, { error })}
              {...register("password", { required: t("verify.required.password") })}
              data-testid="password-text-input"
            />
          </Field>

          {loginName && <input type="hidden" name="loginName" autoComplete="username" value={loginName} />}
        </div>

        {info && (
          <div>
            <Alert type={AlertType.INFO}>{info}</Alert>
          </div>
        )}

        <div className="flex w-full flex-col gap-2">
          <Button
            type="submit"
            size={ButtonSizes.Large}
            variant={ButtonVariants.Primary}
            disabled={loading || !formState.isValid}
            onClick={handleSubmit(submitPassword)}
            data-testid="submit-button"
          >
            {loading && <Spinner className="size-4" />} <Translated i18nKey="verify.submit" namespace="password" />
          </Button>
          <BackButton data-testid="back-button" />
        </div>
      </form>
    </>
  );
}
