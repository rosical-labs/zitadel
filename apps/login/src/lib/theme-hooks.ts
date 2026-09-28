"use client";

import { getThemeConfig } from "./theme";

/**
 * Custom hook that returns the theme configuration for client-side usage.
 *
 * NOTE: This is a client-side hook and requires "use client" directive.
 */
export function useThemeConfig() {
  return getThemeConfig();
}
