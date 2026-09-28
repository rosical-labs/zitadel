import { resolveLocalizedLegalLink } from "@/lib/legal-links";
import { LegalAndSupportSettings } from "@zitadel/proto/zitadel/settings/v2/legal_settings_pb";
import { useLocale, useTranslations } from "next-intl";

type FooterLink = { key: string; href: string; label: string };

// Only the links an administrator configured; docsLink is left out because it defaults to the ZITADEL docs.
function getFooterLinks(
  legal: LegalAndSupportSettings,
  locale: string,
  t: (key: "tos" | "privacy" | "help" | "support") => string,
): FooterLink[] {
  const links: FooterLink[] = [];
  const tosLink = resolveLocalizedLegalLink(legal.tosLink, locale);
  const privacyPolicyLink = resolveLocalizedLegalLink(legal.privacyPolicyLink, locale);
  const helpLink = resolveLocalizedLegalLink(legal.helpLink, locale);

  if (tosLink) links.push({ key: "tos", href: tosLink, label: t("tos") });
  if (privacyPolicyLink) links.push({ key: "privacy", href: privacyPolicyLink, label: t("privacy") });
  if (helpLink) links.push({ key: "help", href: helpLink, label: t("help") });
  if (legal.supportEmail) links.push({ key: "support", href: `mailto:${legal.supportEmail}`, label: t("support") });
  if (legal.customLink && legal.customLinkText) {
    links.push({
      key: "custom",
      href: resolveLocalizedLegalLink(legal.customLink, locale) ?? legal.customLink,
      label: legal.customLinkText,
    });
  }

  return links;
}

/** Muted row of the instance's legal and support links; renders nothing when none are configured. */
export function LegalFooter({ legal }: { legal?: LegalAndSupportSettings }) {
  const locale = useLocale();
  const t = useTranslations("footer");

  if (!legal) {
    return null;
  }

  const links = getFooterLinks(legal, locale, t);
  if (!links.length) {
    return null;
  }

  return (
    <nav
      aria-label={t("label")}
      className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs"
      data-testid="legal-footer"
    >
      {links.map((link) => (
        <a
          key={link.key}
          href={link.href}
          target={link.key === "support" ? undefined : "_blank"}
          rel="noopener noreferrer"
          className="hover:text-foreground focus-visible:ring-ring/50 underline-offset-4 transition-colors outline-none hover:underline focus-visible:ring-[3px]"
          data-testid={`legal-footer-${link.key}`}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
