import * as zitadelModule from "@/lib/zitadel";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProductForRequest } from "./product-context";

vi.mock("@/lib/zitadel", () => ({ getAuthRequest: vi.fn() }));

// Logger mocked only to assert the warning.
const { warn } = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ warn }) }));

const serviceConfig = { baseUrl: "https://zitadel.example.com" };

function mockClientId(clientId: string) {
  vi.mocked(zitadelModule.getAuthRequest).mockResolvedValue({ authRequest: { clientId } } as any);
}

describe("getProductForRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("DIGISAT_PRODUCT_CLIENTS", '{"ec-client":"endpoint-control"}');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the product mapped to the OIDC client", async () => {
    mockClientId("ec-client");

    await expect(getProductForRequest("oidc_abc123", serviceConfig)).resolves.toBe("endpoint-control");
    expect(zitadelModule.getAuthRequest).toHaveBeenCalledWith({ serviceConfig, authRequestId: "abc123" });
  });

  it("returns undefined for an unmapped OIDC client", async () => {
    mockClientId("hub-client");

    await expect(getProductForRequest("oidc_abc123", serviceConfig)).resolves.toBeUndefined();
  });

  it.each(["saml_abc123", "device_abc123"])("ignores %s without calling the API", async (requestId) => {
    await expect(getProductForRequest(requestId, serviceConfig)).resolves.toBeUndefined();
    expect(zitadelModule.getAuthRequest).not.toHaveBeenCalled();
  });

  it("returns undefined without a request id", async () => {
    await expect(getProductForRequest(undefined, serviceConfig)).resolves.toBeUndefined();
    expect(zitadelModule.getAuthRequest).not.toHaveBeenCalled();
  });

  it("returns undefined and logs a warning when the auth request can't be read", async () => {
    vi.mocked(zitadelModule.getAuthRequest).mockRejectedValue(new Error("auth request not found"));

    await expect(getProductForRequest("oidc_gone", serviceConfig)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.any(String), {
      requestId: "oidc_gone",
      error: "auth request not found",
    });
  });

  it("throws on a broken config even without a request id", async () => {
    vi.stubEnv("DIGISAT_PRODUCT_CLIENTS", '{"ec-client":"crm"}');

    await expect(getProductForRequest(undefined, serviceConfig)).rejects.toThrow(/unknown product "crm"/);
  });
});
