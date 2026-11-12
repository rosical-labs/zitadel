import { describe, expect, it } from "vitest";
import { parseProductClients } from "./products";

describe("parseProductClients", () => {
  it("returns the mapping for valid products", () => {
    expect(parseProductClients('{"client-a":"endpoint-control","client-b":"mail-arsiv"}')).toEqual({
      "client-a": "endpoint-control",
      "client-b": "mail-arsiv",
    });
  });

  it("returns an empty map when unset or empty", () => {
    expect(parseProductClients(undefined)).toEqual({});
    expect(parseProductClients("")).toEqual({});
    expect(parseProductClients("  ")).toEqual({});
    expect(parseProductClients("{}")).toEqual({});
  });

  it("throws on invalid JSON", () => {
    expect(() => parseProductClients("{client-a:hotspot}")).toThrow(/DIGISAT_PRODUCT_CLIENTS is not valid JSON/);
  });

  it("throws when the JSON is not an object", () => {
    expect(() => parseProductClients('["hotspot"]')).toThrow(/must be a JSON object/);
    expect(() => parseProductClients("null")).toThrow(/must be a JSON object/);
  });

  it("throws on an unknown product and names the entry", () => {
    expect(() => parseProductClients('{"client-a":"hotspot","client-b":"crm"}')).toThrow(
      /client "client-b" to unknown product "crm"/,
    );
  });

  it("throws on a non-string product", () => {
    expect(() => parseProductClients('{"client-a":1}')).toThrow(/client "client-a" to unknown product 1/);
  });
});
