import clsx from "clsx";
import { PRODUCT_NAMES, PRODUCTS, type Product } from "./products";

/**
 * The website's coloured product band: one tab per product in its own colour, the current one raised.
 * Display only. Tabs grow from their name's width so no name is cut while there is room. Below 960px the tabs shrink to colour strips and only the current tab keeps a visible name.
 */
export function ProductBand({ current, className }: { current: Product | undefined; className?: string }) {
  return (
    <div className={clsx("flex items-end gap-1.5", className)}>
      {PRODUCTS.map((product) => {
        const isCurrent = product === current;
        return (
          <span
            key={product}
            data-product={product}
            aria-current={isCurrent ? "page" : undefined}
            className={clsx(
              "bg-product text-product-foreground font-display flex min-w-0 items-center overflow-hidden rounded-t-[12px] px-3 text-[13px] leading-[18px] font-bold tracking-[-0.01em] whitespace-nowrap",
              isCurrent ? "h-8 flex-[1.8_1_auto] min-[960px]:h-14" : "h-5 flex-auto min-[960px]:h-9",
            )}
          >
            <span className={clsx("min-w-0 truncate", !isCurrent && "max-[959px]:sr-only")}>{PRODUCT_NAMES[product]}</span>
          </span>
        );
      })}
    </div>
  );
}
