import "server-only";

import { createLogger } from "@/lib/logger";
import { getAuthRequest, ServiceConfig } from "@/lib/zitadel";
import { cache } from "react";
import { getProductClients, Product } from "./products";

const logger = createLogger("digisat-product");

const OIDC_PREFIX = "oidc_";

// cache() compares arguments by identity, so the key is primitives, not the serviceConfig object.
const getClientId = cache(
  async (
    authRequestId: string,
    baseUrl: string,
    instanceHost?: string,
    publicHost?: string,
  ): Promise<string | undefined> => {
    const serviceConfig: ServiceConfig = {
      baseUrl,
      ...(instanceHost && { instanceHost }),
      ...(publicHost && { publicHost }),
    };
    try {
      const { authRequest } = await getAuthRequest({ serviceConfig, authRequestId });
      return authRequest?.clientId;
    } catch (error) {
      // An auth request that is already completed or expired must not break the page; it just shows the hub.
      logger.warn("Could not read the auth request to resolve the digisat product", {
        requestId: `${OIDC_PREFIX}${authRequestId}`,
        error: error instanceof Error ? error.message : String(error),
      });
      return undefined;
    }
  },
);

/**
 * The digisat product for the current auth request, for display only: it must never change methods,
 * policies or redirects. Only OIDC requests are mapped (by client id, from DIGISAT_PRODUCT_CLIENTS);
 * SAML, device and missing requests resolve to no product (the hub).
 */
export async function getProductForRequest(
  requestId: string | undefined,
  serviceConfig: ServiceConfig,
): Promise<Product | undefined> {
  // Validated at boot (digisat/startup.ts), so this cannot throw on a server that started.
  const clients = getProductClients();
  if (!requestId?.startsWith(OIDC_PREFIX)) {
    return undefined;
  }

  const clientId = await getClientId(
    requestId.slice(OIDC_PREFIX.length),
    serviceConfig.baseUrl,
    serviceConfig.instanceHost,
    serviceConfig.publicHost,
  );
  return clientId ? clients[clientId] : undefined;
}
