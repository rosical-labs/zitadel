import { Code, ConnectError } from "@connectrpc/connect";
import { describe, expect, it } from "vitest";
import { getAccessDeniedMessageKey } from "./access-denied";
import { ClassifiedConnectError } from "./grpc/interceptors/error-classification";

function classified(message: string, code: Code): ClassifiedConnectError {
  return new ClassifiedConnectError(new ConnectError(message, code));
}

describe("getAccessDeniedMessageKey", () => {
  it("maps a missing user grant to grantRequired", () => {
    const error = classified("Errors.User.GrantRequired (OIDC-foSyH49RvL)", Code.PermissionDenied);
    expect(getAccessDeniedMessageKey(error)).toBe("grantRequired");
  });

  it("maps a missing project grant to projectRequired", () => {
    const error = classified("Errors.User.ProjectRequired (SAML-foSyH49RvL)", Code.PermissionDenied);
    expect(getAccessDeniedMessageKey(error)).toBe("projectRequired");
  });

  it("ignores other permission denied errors", () => {
    const error = classified("Errors.Token.Invalid (AUTH-7fs1e)", Code.PermissionDenied);
    expect(getAccessDeniedMessageKey(error)).toBeUndefined();
  });

  it("ignores the grant key with another code", () => {
    const error = classified("Errors.User.GrantRequired (APP-asb43)", Code.FailedPrecondition);
    expect(getAccessDeniedMessageKey(error)).toBeUndefined();
  });

  it("ignores errors that are not classified", () => {
    expect(getAccessDeniedMessageKey(new ConnectError("Errors.User.GrantRequired", Code.PermissionDenied))).toBeUndefined();
  });
});
