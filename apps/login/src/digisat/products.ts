// Digisat products the login can be opened for. The product only changes the look, never the flow.
export const PRODUCTS = ["hotspot", "mail-arsiv", "endpoint-control", "firewall", "infotv"] as const;

export type Product = (typeof PRODUCTS)[number];

// Display names, lowercase as the design system writes them; product names are never translated.
export const PRODUCT_NAMES: Readonly<Record<Product, string>> = {
  hotspot: "hotspot",
  "mail-arsiv": "mail arşiv",
  "endpoint-control": "endpoint control",
  firewall: "firewall",
  infotv: "infotv",
};

export type ProductClients = Readonly<Record<string, Product>>;

// Set by the proxy from the `requestId` search param, because the root layout gets no search params.
export const REQUEST_ID_HEADER = "x-digisat-request-id";

export function isProduct(value: unknown): value is Product {
  return typeof value === "string" && (PRODUCTS as readonly string[]).includes(value);
}

/**
 * Parses DIGISAT_PRODUCT_CLIENTS, a JSON object `{"<oidc client_id>": "<product>"}`.
 * Unset or empty means no mapping. Invalid JSON or an unknown product throws, so a broken config is visible.
 */
export function parseProductClients(raw: string | undefined): ProductClients {
  if (!raw || raw.trim() === "") {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`DIGISAT_PRODUCT_CLIENTS is not valid JSON: ${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    });
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`DIGISAT_PRODUCT_CLIENTS must be a JSON object {"<client_id>":"<product>"}, got: ${raw}`);
  }

  const clients: Record<string, Product> = {};
  for (const [clientId, product] of Object.entries(parsed)) {
    if (clientId === "") {
      throw new Error("DIGISAT_PRODUCT_CLIENTS has an empty client id");
    }
    if (!isProduct(product)) {
      throw new Error(
        `DIGISAT_PRODUCT_CLIENTS maps client "${clientId}" to unknown product ${JSON.stringify(product)}; expected one of: ${PRODUCTS.join(", ")}`,
      );
    }
    clients[clientId] = product;
  }
  return clients;
}

let memo: { raw: string | undefined; clients: ProductClients } | undefined;

// DIGISAT_PRODUCT_CLIENTS parsed once; re-parsed only if the env value changes (tests).
export function getProductClients(): ProductClients {
  const raw = process.env.DIGISAT_PRODUCT_CLIENTS;
  if (!memo || memo.raw !== raw) {
    memo = { raw, clients: parseProductClients(raw) };
  }
  return memo.clients;
}
