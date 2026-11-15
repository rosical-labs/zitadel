import { mergeMessages } from "@/lib/merge-messages";
import digisatEn from "./locales/en.json";
import digisatTr from "./locales/tr.json";

type Messages = Record<string, unknown>;

// The digisat wording for digisat hosts (and the brand panel and footer copy); the base locales are neutral.
const DIGISAT_MESSAGES: Readonly<Record<string, Messages>> = { en: digisatEn, tr: digisatTr };

// A locale without digisat wording gets the en overlay through the fallback, like any other missing key.
export function getDigisatMessages(locale: string): Messages {
  return DIGISAT_MESSAGES[locale] ?? {};
}

/**
 * The login's messages: local en, then the local locale, then the instance's custom texts, then the
 * organization's (later wins). The custom texts are only what an admin set at that level, so the
 * API's built-in defaults never override the local copy.
 * On a digisat host each local catalog is followed by its digisat overlay (`digisat`, keyed by the en fallback
 * and the loaded locale), so the digisat wording replaces the neutral one but never an admin's custom text.
 */
export function mergeLoginMessages({
  fallback,
  locale,
  digisat,
  instance,
  organization,
}: {
  fallback: Messages;
  locale: Messages;
  digisat: { fallback: Messages; locale: Messages } | undefined;
  instance: Messages;
  organization: Messages;
}): Messages {
  return mergeMessages(fallback, digisat?.fallback, locale, digisat?.locale, instance, organization);
}
