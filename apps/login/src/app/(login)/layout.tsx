import "@/styles/globals.scss";

import { BackgroundWrapper } from "@/components/background-wrapper";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LegalFooter } from "@/components/legal-footer";
import { SkeletonCard } from "@/components/skeleton-card";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeSwitch from "@/components/theme-switch";
import { LANGS, getLanguage } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { getThemeConfig } from "@/lib/theme";
import { getAllowedLanguages, getLegalAndSupportSettings } from "@/lib/zitadel";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import React, { Suspense } from "react";

const geist = Geist({
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("title") };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let languages = LANGS;
  try {
    const settings = await getAllowedLanguages({ serviceConfig });
    if (settings.allowedLanguages?.length) {
      languages = settings.allowedLanguages
        .filter((code) => LANGS.find((l) => l.code === code))
        .map((code) => getLanguage(code));
    }
  } catch (e) {
    console.error("Failed to load supported languages", e);
  }

  // Instance-level links only: org-specific legal settings would need the org from each page's search params.
  let legal;
  try {
    legal = await getLegalAndSupportSettings({ serviceConfig });
  } catch (e) {
    console.error("Failed to load legal and support settings", e);
  }

  return (
    <html className={`${geist.className}`} data-roundness={getThemeConfig().roundness} suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            <Suspense
              fallback={
                <BackgroundWrapper className="ztdl-page-bg bg-background text-foreground flex min-h-dvh flex-col items-center justify-center px-4 py-10">
                  <div className="w-full max-w-[400px]">
                    <SkeletonCard isLoading />
                  </div>
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <ThemeSwitch />
                  </div>
                </BackgroundWrapper>
              }
            >
              <LanguageProvider>
                <BackgroundWrapper className="ztdl-page-bg bg-background text-foreground flex min-h-dvh flex-col items-center justify-center px-4 py-10">
                  <main className="w-full max-w-[400px]">{children}</main>
                  <footer className="mt-6 flex w-full max-w-[400px] flex-col items-center gap-4">
                    <div className="flex items-center justify-center gap-2">
                      <LanguageSwitcher languages={languages} />
                      <ThemeSwitch />
                    </div>
                    <LegalFooter legal={legal} />
                  </footer>
                </BackgroundWrapper>
              </LanguageProvider>
            </Suspense>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
