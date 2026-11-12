import { useTranslations } from "next-intl";
import { DigisatLogo } from "./logo";
import { ProductBand } from "./product-band";
import type { Product } from "./products";

/**
 * Left brand panel of the sign-in screen: ink in both themes, the reversed logo, the headline and the product band.
 * Below 960px it collapses to an 88px header with the logo and the band.
 */
export function BrandPanel({ product }: { product: Product | undefined }) {
  const t = useTranslations("digisat.brand");

  return (
    <aside className="bg-topbar text-topbar-foreground relative h-[88px] shrink-0 overflow-hidden px-5 pt-4 min-[960px]:flex min-[960px]:h-auto min-[960px]:flex-col min-[960px]:justify-between min-[960px]:px-10 min-[960px]:pt-10 min-[960px]:pb-[120px]">
      <DigisatLogo className="h-6 w-auto min-[960px]:h-8 min-[960px]:self-start" />
      <div className="hidden min-[960px]:block">
        <p className="font-display max-w-[420px] text-[48px] leading-[48px] font-extrabold tracking-[-0.03em]">
          {t("headline")}
        </p>
        <p className="mt-4 max-w-[380px] text-base leading-6 opacity-80">{t("lead")}</p>
      </div>
      <ProductBand current={product} className="absolute inset-x-5 bottom-0 min-[960px]:inset-x-10" />
    </aside>
  );
}
