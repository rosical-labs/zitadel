"use client";

import { useCompletionView } from "@/digisat/step-override";
import { Field, fieldDescribedBy, Input } from "@/digisat/ui/field";
import { ResendCode } from "@/digisat/ui/resend-code";
import { lowerCaseValidator, numberValidator, symbolValidator, upperCaseValidator } from "@/helpers/validators";
import { handleServerActionResponse } from "@/lib/client-utils";
import { changePassword, resetPassword, sendPassword } from "@/lib/server/password";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonSizes, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { PasswordComplexity } from "./password-complexity";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs =
  | {
      code: string;
      password: string;
      confirmPassword: string;
    }
  | FieldValues;

const CODE_FIELD_ID = "code";

type Props = {
  code?: string;
  passwordComplexitySettings: PasswordComplexitySettings;
  loginName: string;
  userId: string;
  organization?: string;
  defaultOrganization?: string;
  requestId?: string;
  codeRequired: boolean;
};

export function SetPasswordForm({
  passwordComplexitySettings,
  organization,
  defaultOrganization,
  requestId,
  loginName,
  userId,
  code,
  codeRequired,
}: Props) {
  const { register, handleSubmit, watch, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      code: code ?? "",
    },
  });

  const t = useTranslations("password");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const router = useRouter();
  const withCompletionView = useCompletionView(); // digisat: the view after a completed sign-in

  async function resendCode() {
    setError("");
    setLoading(true);

    const response = await resetPassword({
      loginName,
      organization,
      defaultOrganization,
      requestId,
    })
      .catch(() => {
        setError(t("set.errors.couldNotResetPassword"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && typeof response.error === "string") {
      setError(response.error);
      return;
    }
  }

  async function submitPassword(values: Inputs) {
    setLoading(true);

    let payload: { userId: string; password: string; code?: string; organization?: string } = {
      userId: userId,
      password: values.password,
      organization,
    };

    // this is not required for initial password setup
    if (codeRequired) {
      payload = { ...payload, code: values.code };
    }

    const changeResponse = await changePassword(payload).catch(() => {
      setError(t("set.errors.couldNotSetPassword"));
      setLoading(false);
      return;
    });

    if (changeResponse && "error" in changeResponse) {
      setLoading(false);
      setError(changeResponse.error);
      return;
    }

    if (!changeResponse) {
      setLoading(false);
      setError(t("set.errors.couldNotSetPassword"));
      return;
    }

    const params = new URLSearchParams({});

    if (loginName) {
      params.append("loginName", loginName);
    }
    if (organization) {
      params.append("organization", organization);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for a second to avoid eventual consistency issues with an initial password being set

    const passwordResponse = await sendPassword({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password: values.password },
      }),
      requestId,
    }).catch(() => {
      setError(t("set.errors.couldNotVerifyPassword"));
      setLoading(false);
      return;
    });

    setLoading(false);
    // digisat: handoff, or the no-access step for a user without access
    withCompletionView(passwordResponse, () =>
      handleServerActionResponse(passwordResponse as any, router, setSamlData, setError),
    );

    return;
  }

  const { errors } = formState;
  const codeError = errors.code?.message as string | undefined;

  const watchPassword = watch("password", "");
  const watchConfirmPassword = watch("confirmPassword", "");

  const hasMinLength = passwordComplexitySettings && watchPassword?.length >= passwordComplexitySettings.minLength;
  const hasSymbol = symbolValidator(watchPassword);
  const hasNumber = numberValidator(watchPassword);
  const hasUppercase = upperCaseValidator(watchPassword);
  const hasLowercase = lowerCaseValidator(watchPassword);

  const policyIsValid =
    passwordComplexitySettings &&
    (passwordComplexitySettings.requiresLowercase ? hasLowercase : true) &&
    (passwordComplexitySettings.requiresNumber ? hasNumber : true) &&
    (passwordComplexitySettings.requiresUppercase ? hasUppercase : true) &&
    (passwordComplexitySettings.requiresSymbol ? hasSymbol : true) &&
    hasMinLength;

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      {/* digisat: step card layout: fields, the rules as help text, one full-width primary, "Geri" as ghost */}
      <form className="flex w-full flex-col gap-4">
        <div className="grid grid-cols-1 gap-4">
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={loginName}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            className="sr-only"
          />
          {/* digisat: the code (instance-configurable length) as one mono field, the resend action as a line under it */}
          {codeRequired && (
            <div className="flex flex-col gap-1.5">
              <Field id={CODE_FIELD_ID} label={t("set.labels.code")} error={codeError}>
                <Input
                  id={CODE_FIELD_ID}
                  type="text"
                  mono
                  autoFocus
                  required
                  invalid={!!codeError}
                  aria-describedby={fieldDescribedBy(CODE_FIELD_ID, { error: codeError })}
                  {...register("code", {
                    required: t("set.required.code"),
                  })}
                  autoComplete="one-time-code"
                  data-testid="code-text-input"
                />
              </Field>
              <ResendCode
                prompt={t("set.noCodeReceived")}
                label={t("set.resend")}
                disabled={loading}
                onClick={() => {
                  resendCode();
                }}
                data-testid="resend-button"
              />
            </div>
          )}
          <div>
            <TextInput
              type="password"
              autoComplete="new-password"
              autoFocus={!codeRequired}
              required
              {...register("password", {
                required: t("set.required.newPassword"),
              })}
              label={t("set.labels.newPassword")}
              error={errors.password?.message as string}
              data-testid="password-set-text-input"
            />
          </div>
          <div>
            <TextInput
              type="password"
              required
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: t("set.required.confirmPassword"),
              })}
              label={t("set.labels.confirmPassword")}
              error={errors.confirmPassword?.message as string}
              data-testid="password-set-confirm-text-input"
            />
          </div>
        </div>

        {passwordComplexitySettings && (
          <PasswordComplexity
            passwordComplexitySettings={passwordComplexitySettings}
            password={watchPassword}
            equals={!!watchPassword && watchPassword === watchConfirmPassword}
          />
        )}

        {error && <Alert>{error}</Alert>}

        <div className="flex w-full flex-col gap-2">
          <Button
            type="submit"
            size={ButtonSizes.Large}
            variant={ButtonVariants.Primary}
            disabled={loading || !policyIsValid || !formState.isValid || watchPassword !== watchConfirmPassword}
            onClick={handleSubmit(submitPassword)}
            data-testid="submit-button"
          >
            {loading && <Spinner className="size-4" />}{" "}
            {/* digisat: a reset changes the password, a first-time set saves it */}
            <Translated i18nKey={codeRequired ? "set.resetSubmit" : "set.submit"} namespace="password" />
          </Button>
          <BackButton data-testid="back-button" />
        </div>
      </form>
    </>
  );
}
