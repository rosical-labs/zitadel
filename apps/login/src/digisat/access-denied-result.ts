// A completion result (see src/lib/access-denied.ts) for a user without access to the application. The `error`
// string stays as before; `accessDenied` only lets the forms show the no-access step instead of a field error.
export type AccessDeniedResult = { error: string; accessDenied: true };

export function isAccessDenied(result: unknown): result is AccessDeniedResult {
  return typeof result === "object" && result !== null && "accessDenied" in result && result.accessDenied === true;
}
