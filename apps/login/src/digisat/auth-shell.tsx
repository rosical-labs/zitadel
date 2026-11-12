import { BackgroundWrapper } from "@/components/background-wrapper";
import { Lang } from "@/lib/i18n";
import { LegalAndSupportSettings } from "@zitadel/proto/zitadel/settings/v2/legal_settings_pb";
import { ReactNode } from "react";
import { AuthFooter } from "./auth-footer";
import { BrandPanel } from "./brand-panel";
import { LanguageToggle } from "./language-toggle";
import type { Product } from "./products";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  product: Product | undefined;
  languages: Lang[];
  legal: LegalAndSupportSettings | undefined;
  children: ReactNode;
};

/**
 * The digisat sign-in screen (design system LoginScreen): brand panel 5/12 and the step column 7/12 from 960px,
 * stacked below. The step column holds the language and theme controls, the centred 400px step and the footer.
 */
export function AuthShell({ product, languages, legal, children }: Props) {
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col min-[960px]:grid min-[960px]:grid-cols-[5fr_7fr]">
      <BrandPanel product={product} />
      {/* BackgroundWrapper keeps NEXT_PUBLIC_THEME_BACKGROUND_IMAGE working for the step column. */}
      <BackgroundWrapper className="bg-background flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 px-4 py-3 min-[960px]:px-8 min-[960px]:py-5">
          <LanguageToggle languages={languages} />
          <ThemeToggle />
        </div>
        <main className="flex flex-1 items-center justify-center px-4 pt-6 pb-10 min-[960px]:px-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </main>
        <AuthFooter legal={legal} />
      </BackgroundWrapper>
    </div>
  );
}
