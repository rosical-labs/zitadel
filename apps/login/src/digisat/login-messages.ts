import { mergeMessages } from "@/lib/merge-messages";

type Messages = Record<string, unknown>;

/**
 * The login's messages: local en, then the local locale, then the instance's custom texts, then the
 * organization's (later wins). The custom texts are only what an admin set at that level, so the
 * API's built-in defaults never override the local copy.
 */
export function mergeLoginMessages({
  fallback,
  locale,
  instance,
  organization,
}: {
  fallback: Messages;
  locale: Messages;
  instance: Messages;
  organization: Messages;
}): Messages {
  return mergeMessages(fallback, locale, instance, organization);
}
