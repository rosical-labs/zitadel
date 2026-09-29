import { isClassifiedError } from "@/lib/grpc/interceptors/error-classification";
import { Code } from "@zitadel/client";

export type AccessDeniedMessageKey = "grantRequired" | "projectRequired";

// The API has no translation for these keys, so the raw message starts with the key, e.g. "Errors.User.GrantRequired (OIDC-foSyH49RvL)".
const ACCESS_DENIED_KEYS: Record<string, AccessDeniedMessageKey> = {
  "Errors.User.GrantRequired": "grantRequired",
  "Errors.User.ProjectRequired": "projectRequired",
};

/**
 * Maps the PermissionDenied errors of createCallback (OIDC and SAML) for a user without access to the application
 * to a translation key in the "error" namespace.
 */
export function getAccessDeniedMessageKey(error: unknown): AccessDeniedMessageKey | undefined {
  if (!isClassifiedError(error) || error.code !== Code.PermissionDenied) {
    return undefined;
  }

  const zitadelKey = Object.keys(ACCESS_DENIED_KEYS).find((key) => error.rawMessage.startsWith(key));
  return zitadelKey ? ACCESS_DENIED_KEYS[zitadelKey] : undefined;
}
