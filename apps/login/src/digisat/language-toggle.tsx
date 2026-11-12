"use client";

import { useChangeLanguage } from "@/components/language-switcher";
import { Lang } from "@/lib/i18n";
import { useLocale, useTranslations } from "next-intl";

// The design system offers Turkish first, English second.
const TOGGLE_LANGUAGES = ["tr", "en"];

/** TR/EN segmented control; renders nothing unless both languages are allowed on the instance. */
export function LanguageToggle({ languages }: { languages: Lang[] }) {
  const locale = useLocale();
  const t = useTranslations("digisat.language");
  const changeLanguage = useChangeLanguage();

  const options = TOGGLE_LANGUAGES.map((code) => languages.find((lang) => lang.code === code)).filter(
    (lang): lang is Lang => lang !== undefined,
  );
  if (options.length < 2) {
    return null;
  }

  return (
    <div role="group" aria-label={t("label")} className="bg-muted inline-flex gap-0.5 rounded-full p-[3px]">
      {options.map((lang) => {
        const isCurrent = lang.code === locale;
        return (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            title={lang.name}
            aria-pressed={isCurrent}
            onClick={() => {
              if (!isCurrent) {
                void changeLanguage(lang.code);
              }
            }}
            className="text-muted-foreground hover:text-foreground aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:ring-border focus-visible:outline-ring h-7 cursor-pointer rounded-full px-3 text-[13px] leading-[18px] font-semibold uppercase transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:ring-1"
          >
            {lang.code}
          </button>
        );
      })}
    </div>
  );
}
