"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, ButtonSizes, ButtonVariants } from "./button";

type Props = {
  continueUrl: string;
};

export function VerifySuccessContinue({ continueUrl }: Props) {
  const router = useRouter();
  const t = useTranslations("verify");

  return (
    // digisat: one full-width primary, as in every step card
    <div className="flex w-full flex-col">
      <Button
        type="button"
        size={ButtonSizes.Large}
        variant={ButtonVariants.Primary}
        onClick={() => router.push(continueUrl)}
        data-testid="continue-button"
      >
        {t("successContinue")}
      </Button>
    </div>
  );
}
