import { createLogger } from "@/lib/logger";
import { getProductClients } from "./products";

/**
 * Validates DIGISAT_PRODUCT_CLIENTS once at server start, so a bad mapping stops the boot
 * instead of failing every page at request time. Returns false (after logging why) when invalid.
 */
export function validateProductClientsAtStartup(): boolean {
  try {
    getProductClients();
    return true;
  } catch (error) {
    createLogger("startup").error(error instanceof Error ? error.message : String(error));
    return false;
  }
}
