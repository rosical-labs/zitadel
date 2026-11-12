"use client";

import { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { Children, ReactNode } from "react";
import { ThemeWrapper } from "./theme-wrapper";

// digisat: the step title in the design system's page-title style (Gabarito 800, 28/32, -0.02em)
const TITLE_CLASSES =
  "text-left [&_h1]:font-display [&_h1]:text-[28px] [&_h1]:leading-8 [&_h1]:font-extrabold [&_h1]:tracking-[-0.02em]";

/**
 * DynamicTheme renders the login step frame: a frameless column (title block, then form) on the page background.
 * The logo lives in the digisat brand panel (src/digisat/brand-panel.tsx), not above the step.
 *
 * Children: the first child is the title block (title, description); the rest is the form.
 * A single child is treated as form content only.
 *
 * The layout is the same for every NEXT_PUBLIC_THEME_LAYOUT value; function children receive false.
 */
export function DynamicTheme({
  branding,
  children,
}: {
  children: ReactNode | ((isSideBySide: boolean) => ReactNode);
  branding?: BrandingSettings;
}) {
  const resolvedChildren = typeof children === "function" ? children(false) : children;
  const childArray = Children.toArray(resolvedChildren);
  const hasTitle = childArray.length > 1;
  const titleContent = hasTitle ? childArray[0] : null;
  const formContent = hasTitle ? childArray.slice(1) : childArray;

  return (
    <ThemeWrapper branding={branding}>
      {/* digisat: frameless 400px step column (design system LoginScreen), replacing the logo and the Card */}
      <div className="flex w-full flex-col gap-4">
        {titleContent && <div className={TITLE_CLASSES}>{titleContent}</div>}

        {/* Hidden when a page passes only an empty placeholder, so the column does not end in blank space. */}
        <div className="space-y-6 has-[>:only-child:empty]:hidden">{formContent}</div>
      </div>
    </ThemeWrapper>
  );
}
