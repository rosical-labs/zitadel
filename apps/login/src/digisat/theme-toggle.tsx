"use client";

import { useThemeMode } from "@/components/branding-context";
import { ThemeMode } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const BUTTON_SIZE = "size-9";

/**
 * One ghost icon button that flips between light and dark. Without a stored choice the theme follows the system.
 * Hidden when the branding forces a theme mode, like ThemeSwitch.
 */
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const themeMode = useThemeMode();
  const t = useTranslations("digisat.theme");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (themeMode === ThemeMode.LIGHT || themeMode === ThemeMode.DARK) {
    return null;
  }

  // resolvedTheme is unknown on the server; a same-size placeholder keeps the language control from shifting.
  if (!mounted) {
    return <span className={BUTTON_SIZE} aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? SunIcon : MoonIcon;

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("light") : t("dark")}
      className={`${BUTTON_SIZE} text-foreground hover:bg-accent focus-visible:outline-ring inline-flex cursor-pointer items-center justify-center rounded-full transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}
