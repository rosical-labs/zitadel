import { afterEach, describe, expect, it, vi } from "vitest";
import { isDigisatHost, normalizeHost, parseDigisatHosts } from "./hosts";

describe("parseDigisatHosts", () => {
  it("returns no hosts when unset or blank", () => {
    expect(parseDigisatHosts(undefined).size).toBe(0);
    expect(parseDigisatHosts("").size).toBe(0);
    expect(parseDigisatHosts("   ").size).toBe(0);
  });

  it("returns the normalised hostnames", () => {
    expect(Array.from(parseDigisatHosts(" Auth.Digisat.Cloud , digisat-abc.iam.svc.rosical.dev:8080"))).toEqual([
      "auth.digisat.cloud",
      "digisat-abc.iam.svc.rosical.dev",
    ]);
  });

  it("throws on an empty entry, including a trailing comma", () => {
    expect(() => parseDigisatHosts("a.example,,b.example")).toThrow(/DIGISAT_HOSTS has an empty entry/);
    expect(() => parseDigisatHosts("a.example,")).toThrow(/DIGISAT_HOSTS has an empty entry/);
  });

  it("throws on a scheme or a path and names the entry", () => {
    expect(() => parseDigisatHosts("https://auth.digisat.cloud")).toThrow(
      /DIGISAT_HOSTS entry "https:\/\/auth.digisat.cloud" must be a bare hostname/,
    );
    expect(() => parseDigisatHosts("auth.digisat.cloud/ui")).toThrow(/must be a bare hostname/);
  });

  it("throws on whitespace inside an entry", () => {
    expect(() => parseDigisatHosts("auth digisat.cloud")).toThrow(
      /DIGISAT_HOSTS entry "auth digisat.cloud" contains whitespace/,
    );
  });
});

describe("normalizeHost", () => {
  it("trims, lowercases and strips the port", () => {
    expect(normalizeHost(" Auth.Digisat.Cloud:443 ")).toBe("auth.digisat.cloud");
    expect(normalizeHost("localhost")).toBe("localhost");
  });
});

describe("isDigisatHost", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("matches a configured host regardless of case and port", () => {
    vi.stubEnv("DIGISAT_HOSTS", "auth.digisat.cloud,digisat-abc.iam.svc.rosical.dev");
    expect(isDigisatHost("auth.digisat.cloud")).toBe(true);
    expect(isDigisatHost("AUTH.digisat.cloud:443")).toBe(true);
    expect(isDigisatHost("digisat-abc.iam.svc.rosical.dev")).toBe(true);
  });

  it("is false for other, missing or unconfigured hosts", () => {
    vi.stubEnv("DIGISAT_HOSTS", "auth.digisat.cloud");
    expect(isDigisatHost("iam.rosical.dev")).toBe(false);
    expect(isDigisatHost("sub.auth.digisat.cloud")).toBe(false);
    expect(isDigisatHost(undefined)).toBe(false);
    vi.stubEnv("DIGISAT_HOSTS", "");
    expect(isDigisatHost("auth.digisat.cloud")).toBe(false);
  });
});
