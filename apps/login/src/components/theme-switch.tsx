"use client";

import { APPEARANCE_STYLES, getComponentRoundness, getThemeConfig } from "@/lib/theme";
import { ComputerDesktopIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { ThemeMode } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useThemeMode } from "./branding-context";
function getThemeToggleRoundness() {
  return getComponentRoundness("themeSwitch");
}

// Helper function to get card appearance styles for the theme switch wrapper
function getThemeSwitchCardAppearance(): string {
  const themeConfig = getThemeConfig();
  const appearance = APPEARANCE_STYLES[themeConfig.appearance];
  return appearance?.card || APPEARANCE_STYLES.flat.card; // Fallback to flat design
}

// Helper function to get selected button styling for clear visibility
function getSelectedButtonStyle(isSelected: boolean): string {
  const themeConfig = getThemeConfig();

  if (!isSelected) {
    return "text-muted-foreground hover:text-foreground";
  }

  // Selected state styling based on appearance theme
  switch (themeConfig.appearance) {
    case "glass":
      return "bg-white/30 dark:bg-black/30 text-gray-900 dark:text-white shadow-lg backdrop-blur-sm border border-white/40 dark:border-white/20";
    case "material":
      return "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md";
    case "flat":
    default:
      return "bg-accent text-accent-foreground shadow-xs";
  }
}

export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const themeMode = useThemeMode();
  const toggleRoundness = getThemeToggleRoundness();
  const cardAppearance = getThemeSwitchCardAppearance();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Hide toggle when theme is forced to light or dark only
  if (themeMode === ThemeMode.LIGHT || themeMode === ThemeMode.DARK) {
    return null;
  }

  // themeMode is AUTO (1) or UNSPECIFIED (0): show light, system, dark options
  return (
    <div className={`flex h-8 items-center gap-0.5 px-0.5 ${toggleRoundness} ${cardAppearance}`}>
      <button
        className={`flex size-6.5 flex-row items-center justify-center ${toggleRoundness} focus-visible:ring-ring/50 transition-colors outline-none focus-visible:ring-[3px] ${getSelectedButtonStyle(theme === "light")}`}
        onClick={() => setTheme("light")}
        aria-label="Switch to light mode"
      >
        <SunIcon className="h-4 w-4" />
      </button>
      <button
        className={`flex size-6.5 flex-row items-center justify-center ${toggleRoundness} focus-visible:ring-ring/50 transition-colors outline-none focus-visible:ring-[3px] ${getSelectedButtonStyle(theme === "system")}`}
        onClick={() => setTheme("system")}
        aria-label="Switch to system mode"
      >
        <ComputerDesktopIcon className="h-4 w-4" />
      </button>
      <button
        className={`flex size-6.5 flex-row items-center justify-center ${toggleRoundness} focus-visible:ring-ring/50 transition-colors outline-none focus-visible:ring-[3px] ${getSelectedButtonStyle(theme === "dark")}`}
        onClick={() => setTheme("dark")}
        aria-label="Switch to dark mode"
      >
        <MoonIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
