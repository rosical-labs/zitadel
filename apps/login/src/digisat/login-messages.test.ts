import { describe, expect, test } from "vitest";
import { mergeLoginMessages } from "./login-messages";

describe("mergeLoginMessages", () => {
  const fallback = { loginname: { title: "Sign in", submit: "Continue", description: "en description" } };
  const locale = { loginname: { title: "Giriş yapın", submit: "Devam" } };

  test("uses the local locale over local en when no custom texts are set", () => {
    const messages = mergeLoginMessages({ fallback, locale, instance: {}, organization: {} });
    expect(messages).toEqual({ loginname: { title: "Giriş yapın", submit: "Devam", description: "en description" } });
  });

  test("lets an instance custom text override the local copy, key by key", () => {
    const messages = mergeLoginMessages({
      fallback,
      locale,
      instance: { loginname: { title: "Hoş geldiniz" } },
      organization: {},
    });
    expect(messages).toEqual({ loginname: { title: "Hoş geldiniz", submit: "Devam", description: "en description" } });
  });

  test("lets an organization custom text override the instance's", () => {
    const messages = mergeLoginMessages({
      fallback,
      locale,
      instance: { loginname: { title: "Instance", submit: "Instance submit" } },
      organization: { loginname: { title: "Org" } },
    });
    expect(messages).toEqual({ loginname: { title: "Org", submit: "Instance submit", description: "en description" } });
  });
});
