"use client";

import { Logo } from "@/components/logo";
import { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { Children, ReactNode } from "react";
import { Card } from "./card";
import { ThemeWrapper } from "./theme-wrapper";

/**
 * DynamicTheme renders the login page frame: the instance logo above one centered card.
 *
 * Children: the first child is the title block (title, description), rendered as the card header;
 * the rest is the form. A single child is treated as form content only.
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
      <div className="flex w-full flex-col items-center gap-8">
        {branding && (
          <Logo lightSrc={branding.lightTheme?.logoUrl} darkSrc={branding.darkTheme?.logoUrl} height={80} width={320} />
        )}

        <Card className="w-full" padding="p-6 sm:p-8">
          {titleContent && <div className="text-left">{titleContent}</div>}

          {/* Hidden when a page passes only an empty placeholder, so the card does not end in blank space. */}
          <div className={`space-y-6 has-[>:only-child:empty]:hidden ${titleContent ? "mt-6" : ""}`}>{formContent}</div>
        </Card>
      </div>
    </ThemeWrapper>
  );
}
