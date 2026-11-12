"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

type Props = {
  url: string;
  fields: Record<string, string>;
};

export function AutoSubmitForm({ url, fields }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const t = useTranslations("signedin");

  useEffect(() => {
    if (formRef.current) {
      formRef.current.submit();
    }
  }, []);

  return (
    <form ref={formRef} action={url} method="post">
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <noscript>
        {/* digisat: via i18n */}
        <button type="submit">{t("continue")}</button>
      </noscript>
    </form>
  );
}
