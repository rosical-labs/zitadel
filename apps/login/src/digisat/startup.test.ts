import { afterEach, describe, expect, it, vi } from "vitest";
import { validateDigisatHostsAtStartup, validateProductClientsAtStartup } from "./startup";

// Logger mocked only to assert the startup error.
const { error } = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("@/lib/logger", () => ({ createLogger: () => ({ error }) }));

describe("validateProductClientsAtStartup", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    error.mockReset();
  });

  it("accepts a valid or missing mapping", () => {
    vi.stubEnv("DIGISAT_PRODUCT_CLIENTS", '{"ec-client":"endpoint-control"}');
    expect(validateProductClientsAtStartup()).toBe(true);
    vi.stubEnv("DIGISAT_PRODUCT_CLIENTS", "");
    expect(validateProductClientsAtStartup()).toBe(true);
    expect(error).not.toHaveBeenCalled();
  });

  it("rejects an invalid mapping and logs the named entry", () => {
    vi.stubEnv("DIGISAT_PRODUCT_CLIENTS", '{"x":"nope"}');
    expect(validateProductClientsAtStartup()).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/client "x" to unknown product "nope"/));
  });
});

describe("validateDigisatHostsAtStartup", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    error.mockReset();
  });

  it("accepts a valid, blank or missing host list", () => {
    vi.stubEnv("DIGISAT_HOSTS", "auth.digisat.cloud,digisat-abc.iam.svc.rosical.dev");
    expect(validateDigisatHostsAtStartup()).toBe(true);
    vi.stubEnv("DIGISAT_HOSTS", "");
    expect(validateDigisatHostsAtStartup()).toBe(true);
    vi.stubEnv("DIGISAT_HOSTS", undefined);
    expect(validateDigisatHostsAtStartup()).toBe(true);
    expect(error).not.toHaveBeenCalled();
  });

  it("rejects a malformed entry and logs it", () => {
    vi.stubEnv("DIGISAT_HOSTS", "https://auth.digisat.cloud");
    expect(validateDigisatHostsAtStartup()).toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringMatching(/DIGISAT_HOSTS entry "https:\/\/auth.digisat.cloud"/));
  });
});
