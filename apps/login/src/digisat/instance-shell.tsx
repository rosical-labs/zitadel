import { BackgroundWrapper } from "@/components/background-wrapper";
import { Lang } from "@/lib/i18n";
import { LegalAndSupportSettings } from "@zitadel/proto/zitadel/settings/v2/legal_settings_pb";
import { ReactNode } from "react";
import { FooterLinks } from "./auth-footer";
import { LanguageToggle } from "./language-toggle";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  languages: Lang[];
  legal: LegalAndSupportSettings | undefined;
  children: ReactNode;
};

/**
 * The sign-in screen on a non-digisat host: one centred column with the language and theme controls, the step
 * (instance logo and card, see DynamicTheme) and the instance's legal links. No brand panel, no digisat mark.
 */
export function InstanceShell({ languages, legal, children }: Props) {
  return (
    <BackgroundWrapper className="bg-background text-foreground flex min-h-dvh flex-col">
      <div className="flex items-center justify-end gap-2 px-4 py-3 min-[960px]:px-8 min-[960px]:py-5">
        <LanguageToggle languages={languages} />
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-center justify-center px-4 pt-6 pb-10">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
      <footer className="text-muted-foreground flex items-center justify-center px-4 py-4 text-xs leading-4">
        <FooterLinks legal={legal} />
      </footer>
    </BackgroundWrapper>
  );
}
