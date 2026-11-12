"use client";

import { LockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getHubUrl } from "../hub-url";
import { useProduct } from "../product-provider";
import { PRODUCT_NAMES } from "../products";
import { buttonClasses } from "./button-styles";

// The existing logout page (src/app/(login)/logout), with the organization it reads, as the step's URL carries it.
function logoutHref(organization: string | null): string {
  if (!organization) {
    return "/logout";
  }
  return "/logout?" + new URLSearchParams({ organization });
}

/**
 * Design system EmptyState for a user without access to the application: a lock, which app, who to ask, and the
 * hub or sign-out. The hub ("digisat'a git") only when a product is known and the login settings have a safe
 * defaultRedirectUri: without a product the denied app may be the hub itself, so it could loop. Sign-out is then
 * the one primary action.
 * Focus moves to the title, because the control that submitted the step is now hidden.
 */
export function NoAccess() {
  const t = useTranslations("digisat.noAccess");
  const product = useProduct();
  const organization = useSearchParams().get("organization");
  const [hubUrl, setHubUrl] = useState<string | undefined>(undefined);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!product) {
      return;
    }
    let current = true;
    getHubUrl(organization ?? undefined)
      .then((url) => {
        if (current) {
          setHubUrl(url);
        }
      })
      // Without the hub link the step still offers sign-out; the failure is logged, not hidden.
      .catch((error: unknown) => console.error("NoAccess: could not load the hub URL", error));
    return () => {
      current = false;
    };
  }, [organization, product]);

  return (
    <div className="flex flex-col items-center gap-2 text-center" data-testid="no-access">
      <div className="bg-danger-surface text-destructive mb-2 flex size-12 items-center justify-center rounded-t-[12px] rounded-b-[4px]">
        <LockIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </div>
      <h1 ref={titleRef} tabIndex={-1} className="font-display text-lg leading-6 font-bold tracking-[-0.01em] outline-none">
        {t("title")}
      </h1>
      <p className="text-muted-foreground max-w-[380px] text-sm leading-5">
        {product ? t("product", { name: PRODUCT_NAMES[product] }) : t("generic")}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {hubUrl && (
          <a href={hubUrl} className={buttonClasses("primary", "lg")}>
            {t("hub")}
          </a>
        )}
        <Link href={logoutHref(organization)} className={buttonClasses(product ? "outline" : "primary", "lg")}>
          {t("signOut")}
        </Link>
      </div>
    </div>
  );
}
