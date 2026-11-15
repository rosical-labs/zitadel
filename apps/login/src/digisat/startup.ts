import { createLogger } from "@/lib/logger";
import { getDigisatHosts } from "./hosts";
import { getProductClients } from "./products";

// Logs why a digisat env value is invalid; false stops the boot.
function validateAtStartup(load: () => unknown): boolean {
  try {
    load();
    return true;
  } catch (error) {
    createLogger("startup").error(error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Validates DIGISAT_PRODUCT_CLIENTS once at server start, so a bad mapping stops the boot
 * instead of failing every page at request time. Returns false (after logging why) when invalid.
 */
export function validateProductClientsAtStartup(): boolean {
  return validateAtStartup(getProductClients);
}

/**
 * Validates DIGISAT_HOSTS once at server start. Unset or blank is valid (no host is digisat);
 * a malformed entry returns false after logging why.
 */
export function validateDigisatHostsAtStartup(): boolean {
  return validateAtStartup(getDigisatHosts);
}
