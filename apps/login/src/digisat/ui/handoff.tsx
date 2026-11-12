"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useProduct } from "../product-provider";
import { PRODUCT_NAMES } from "../products";

// Shown in the tab when no product sent the user (the hub); the tab keeps the default product colour.
const HUB_NAME = "digisat";

/**
 * Design system handoff (.dg-handoff): the target product's tab, "Yönlendiriliyorsunuz" and a thin progress bar.
 * No manual link: it only shows while the navigation is in flight, and re-requesting a one-time OIDC callback could
 * break the sign-in. Focus moves to the title, because the control that started the navigation is now hidden.
 */
export function Handoff() {
  const t = useTranslations("digisat.handoff");
  const product = useProduct();
  const name = product ? PRODUCT_NAMES[product] : HUB_NAME;
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 text-center" data-testid="handoff">
      <div
        aria-hidden="true"
        className="bg-product text-product-foreground font-display flex h-[72px] w-[180px] items-end justify-center rounded-t-[20px] rounded-b-[4px] px-3 pb-3 text-base leading-5 font-extrabold tracking-[-0.01em]"
      >
        <span className="truncate">{name}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="font-display text-[28px] leading-8 font-extrabold tracking-[-0.02em] outline-none"
        >
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm leading-5">{t("opening", { name })}</p>
      </div>
      <div aria-hidden="true" className="bg-muted h-1 w-[200px] overflow-hidden rounded-[4px]">
        <span className="bg-foreground block h-full w-3/5 rounded-[4px] motion-safe:animate-[digisat-handoff-progress_1.4s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
