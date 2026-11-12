import "@/styles/globals.scss";

import { LanguageProvider } from "@/components/language-provider";
import { SkeletonCard } from "@/components/skeleton-card";
import { ThemeProvider } from "@/components/theme-provider";
// digisat: the sign-in screen layout (brand panel, toolbar, footer) replaces the toolbar, page background and LegalFooter
import { AuthShell } from "@/digisat/auth-shell";
// digisat: design system fonts (Gabarito, Instrument Sans, IBM Plex Mono) replace Geist
import { fontVariables } from "@/digisat/fonts";
// digisat: product context (data-product on <html>) from the auth request's client id
import { getProductForRequest } from "@/digisat/product-context";
import { ProductProvider } from "@/digisat/product-provider";
import { REQUEST_ID_HEADER } from "@/digisat/products";
import { LANGS, getLanguage } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { getThemeConfig } from "@/lib/theme";
import { getAllowedLanguages, getLegalAndSupportSettings } from "@/lib/zitadel";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import React, { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("title") };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);
  // digisat: display only, never affects the flow
  const product = await getProductForRequest(_headers.get(REQUEST_ID_HEADER) ?? undefined, serviceConfig);

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

  // digisat: data-product selects the product accent in digisat/globals.css
  return (
    <html
      className={fontVariables}
      data-roundness={getThemeConfig().roundness}
      data-product={product}
      suppressHydrationWarning
    >
      <head />
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            {/* digisat: the shell stays outside Suspense, so the loading state already shows the brand panel */}
            <LanguageProvider>
              <AuthShell product={product} languages={languages} legal={legal}>
                <Suspense fallback={<SkeletonCard isLoading />}>
                  {/* digisat: product for client components (useProduct) */}
                  <ProductProvider product={product}>{children}</ProductProvider>
                </Suspense>
              </AuthShell>
            </LanguageProvider>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
