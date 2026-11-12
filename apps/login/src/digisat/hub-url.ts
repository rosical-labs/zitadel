"use server";

import { isSafeRedirectUri } from "@/lib/client-utils";
import { getServiceConfig } from "@/lib/service-url";
import { getLoginSettings } from "@/lib/zitadel";
import { headers } from "next/headers";

/**
 * The digisat hub for the no-access step: the login settings' defaultRedirectUri, when set and safe.
 * Display only (a link the user may follow); getLoginSettings is cached, so this rarely reaches the API.
 */
export async function getHubUrl(organization: string | undefined): Promise<string | undefined> {
  const { serviceConfig } = getServiceConfig(await headers());
  const loginSettings = await getLoginSettings({ serviceConfig, organization });
  const hubUrl = loginSettings?.defaultRedirectUri;

  if (!hubUrl || !isSafeRedirectUri(hubUrl)) {
    return undefined;
  }
  return hubUrl;
}
