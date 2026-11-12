"use client";

import { useTranslations } from "next-intl";
import { useProduct } from "../product-provider";
import { PRODUCT_NAMES } from "../products";

/**
 * Design system context pill above the login name title: "<product> uygulamasına devam etmek için giriş yapın".
 * Renders nothing without a product (hub or direct visit). Display only.
 */
export function ContextLabel() {
  const product = useProduct();
  const t = useTranslations("digisat");

  if (!product) {
    return null;
  }

  return (
    <p className="bg-product-tint text-foreground inline-flex min-h-8 items-center gap-2.5 self-start rounded-[16px] py-1 pr-3 pl-1 text-[13px] leading-[18px] font-medium">
      {t.rich("context.continueTo", {
        name: PRODUCT_NAMES[product],
        product: (chunks) => (
          <span className="bg-product text-product-foreground font-display inline-flex h-6 shrink-0 items-center rounded-t-[8px] rounded-b-[2px] px-2.5 text-xs leading-4 font-bold">
            {chunks}
          </span>
        ),
      })}
    </p>
  );
}
