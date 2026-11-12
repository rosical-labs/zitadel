import { resolveLocalizedLegalLink } from "@/lib/legal-links";
import { LegalAndSupportSettings } from "@zitadel/proto/zitadel/settings/v2/legal_settings_pb";
import { useLocale, useTranslations } from "next-intl";

type FooterLink = { key: "privacy" | "help"; href: string };

// The design system's footer carries only the privacy and help links; unset ones are left out.
function getFooterLinks(legal: LegalAndSupportSettings | undefined, locale: string): FooterLink[] {
  const links: FooterLink[] = [];
  const privacy = resolveLocalizedLegalLink(legal?.privacyPolicyLink, locale);
  const help = resolveLocalizedLegalLink(legal?.helpLink, locale);

  if (privacy) links.push({ key: "privacy", href: privacy });
  if (help) links.push({ key: "help", href: help });
  return links;
}

/** "© digisat" on the left, the instance's privacy and help links on the right. */
export function AuthFooter({ legal }: { legal: LegalAndSupportSettings | undefined }) {
  const locale = useLocale();
  const t = useTranslations("digisat.footer");
  const tLegal = useTranslations("footer");
  const links = getFooterLinks(legal, locale);

  return (
    <footer className="text-muted-foreground flex items-center justify-between gap-4 px-4 py-4 text-xs leading-4 min-[960px]:px-8">
      <span>{t("copyright")}</span>
      {links.length > 0 && (
        <nav aria-label={tLegal("label")} className="flex gap-4" data-testid="legal-footer">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground focus-visible:outline-ring underline-offset-4 transition-colors outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
              data-testid={`legal-footer-${link.key}`}
            >
              {tLegal(link.key)}
            </a>
          ))}
        </nav>
      )}
    </footer>
  );
}
