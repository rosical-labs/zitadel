import { describe, expect, test } from "vitest";
import en from "../../locales/en.json";
import tr from "../../locales/tr.json";
import { getDigisatMessages, mergeLoginMessages } from "./login-messages";

describe("mergeLoginMessages", () => {
  const fallback = { loginname: { title: "Sign in", submit: "Continue", description: "en description" } };
  const locale = { loginname: { title: "Giriş yapın", submit: "Devam" } };

  test("uses the local locale over local en when no custom texts are set", () => {
    const messages = mergeLoginMessages({ fallback, locale, digisat: undefined, instance: {}, organization: {} });
    expect(messages).toEqual({ loginname: { title: "Giriş yapın", submit: "Devam", description: "en description" } });
  });

  test("lets an instance custom text override the local copy, key by key", () => {
    const messages = mergeLoginMessages({
      fallback,
      locale,
      digisat: undefined,
      instance: { loginname: { title: "Hoş geldiniz" } },
      organization: {},
    });
    expect(messages).toEqual({ loginname: { title: "Hoş geldiniz", submit: "Devam", description: "en description" } });
  });

  test("lets an organization custom text override the instance's", () => {
    const messages = mergeLoginMessages({
      fallback,
      locale,
      digisat: undefined,
      instance: { loginname: { title: "Instance", submit: "Instance submit" } },
      organization: { loginname: { title: "Org" } },
    });
    expect(messages).toEqual({ loginname: { title: "Org", submit: "Instance submit", description: "en description" } });
  });
});

describe("mergeLoginMessages with the digisat overlay", () => {
  const fallback = { loginname: { title: "Sign in", description: "Your account." }, digisat: { or: "or" } };
  const locale = { loginname: { description: "Hesabınız." } };
  const digisat = {
    fallback: { loginname: { description: "Your digisat account." }, digisat: { footer: { copyright: "© digisat" } } },
    locale: { loginname: { description: "digisat hesabınız." } },
  };

  test("uses the digisat wording on a digisat host", () => {
    const messages = mergeLoginMessages({ fallback, locale, digisat, instance: {}, organization: {} });
    expect(messages).toEqual({
      loginname: { title: "Sign in", description: "digisat hesabınız." },
      digisat: { or: "or", footer: { copyright: "© digisat" } },
    });
  });

  test("keeps a locale's own text over the en overlay when the locale has no digisat wording", () => {
    const messages = mergeLoginMessages({
      fallback,
      locale: { loginname: { description: "Ihr Konto." } },
      digisat: { fallback: digisat.fallback, locale: {} },
      instance: {},
      organization: {},
    });
    expect(messages).toMatchObject({
      loginname: { description: "Ihr Konto." },
      digisat: { footer: { copyright: "© digisat" } },
    });
  });

  test("lets instance and organization custom texts win over the digisat wording", () => {
    const messages = mergeLoginMessages({
      fallback,
      locale,
      digisat,
      instance: { loginname: { description: "Instance" }, digisat: { footer: { copyright: "© Hotel" } } },
      organization: { loginname: { description: "Org" } },
    });
    expect(messages).toMatchObject({ loginname: { description: "Org" }, digisat: { footer: { copyright: "© Hotel" } } });
  });
});

// The real catalogs: digisat appears only through the overlay, i.e. only on a digisat host.
describe("login catalogs", () => {
  const mentionsDigisat = (messages: Record<string, unknown>) =>
    JSON.stringify(messages).replaceAll('"digisat":', "").toLowerCase().includes("digisat");

  test.each([
    ["en", en],
    ["tr", tr],
  ])("%s is neutral without the overlay and digisat with it", (code, catalog) => {
    const neutral = mergeLoginMessages({
      fallback: en,
      locale: catalog,
      digisat: undefined,
      instance: {},
      organization: {},
    });
    expect(mentionsDigisat(neutral)).toBe(false);

    const digisat = mergeLoginMessages({
      fallback: en,
      locale: catalog,
      digisat: { fallback: getDigisatMessages("en"), locale: getDigisatMessages(code) },
      instance: {},
      organization: {},
    });
    expect(digisat).toMatchObject({ loginname: { description: expect.stringContaining("digisat") } });
    expect(digisat).toMatchObject({
      digisat: { footer: { copyright: "© digisat" }, brand: { headline: expect.any(String) } },
    });
  });

  test("has no digisat overlay for other locales", () => {
    expect(getDigisatMessages("de")).toEqual({});
  });
});
