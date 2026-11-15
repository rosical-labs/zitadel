import "@/styles/globals.scss";

import { LanguageProvider } from "@/components/language-provider";
import { SkeletonCard } from "@/components/skeleton-card";
import { ThemeProvider } from "@/components/theme-provider";
// digisat: the sign-in screen layout (brand panel, toolbar, footer) replaces the toolbar, page background and LegalFooter
import { AuthShell } from "@/digisat/auth-shell";
// digisat: design system fonts (Gabarito, Instrument Sans, IBM Plex Mono) replace Geist
import { fontVariables } from "@/digisat/fonts";
// digisat: only DIGISAT_HOSTS get the digisat look; other hosts get the instance's logo and colours
import { DigisatHostProvider } from "@/digisat/host-provider";
import { isDigisatHost } from "@/digisat/hosts";
import { InstanceShell } from "@/digisat/instance-shell";
// digisat: product context (data-product on <html>) from the auth request's client id
import { getProductForRequest } from "@/digisat/product-context";
import { ProductProvider } from "@/digisat/product-provider";
import { REQUEST_ID_HEADER } from "@/digisat/products";
import { StepOverrideProvider } from "@/digisat/step-override";
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
  // digisat: the instance host is what ZITADEL selects the instance by
  const digisat = isDigisatHost(serviceConfig.instanceHost);
  // digisat: display only, never affects the flow; no product on a non-digisat host
  const product = digisat
    ? await getProductForRequest(_headers.get(REQUEST_ID_HEADER) ?? undefined, serviceConfig)
    : undefined;

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

  const step = (
    <Suspense fallback={<SkeletonCard isLoading />}>
      {/* digisat: product for client components (useProduct) */}
      <ProductProvider product={product}>
        {/* digisat: the handoff and no-access views replace the step */}
        <StepOverrideProvider>{children}</StepOverrideProvider>
      </ProductProvider>
    </Suspense>
  );

  // digisat: data-product selects the product accent in digisat/globals.css;
  // data-brand="instance" maps the tokens to the instance branding (styles/globals.scss)
  return (
    <html
      className={fontVariables}
      data-roundness={getThemeConfig().roundness}
      data-product={product}
      data-brand={digisat ? undefined : "instance"}
      suppressHydrationWarning
    >
      <head />
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            {/* digisat: the shell stays outside Suspense, so the loading state already shows the brand panel */}
            <LanguageProvider>
              <DigisatHostProvider digisat={digisat}>
                {digisat ? (
                  <AuthShell product={product} languages={languages} legal={legal}>
                    {step}
                  </AuthShell>
                ) : (
                  <InstanceShell languages={languages} legal={legal}>
                    {step}
                  </InstanceShell>
                )}
              </DigisatHostProvider>
            </LanguageProvider>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
