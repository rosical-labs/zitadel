import { afterEach, describe, expect, it, vi } from "vitest";
import { validateProductClientsAtStartup } from "./startup";

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
