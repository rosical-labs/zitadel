"use client";

import { setLanguageCookie } from "@/lib/cookies";
import { Lang } from "@/lib/i18n";
import { APPEARANCE_STYLES, getComponentRoundness, getThemeConfig } from "@/lib/theme";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { GlobeIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Helper function to get language switcher roundness from theme
function getLanguageSwitcherRoundness(): string {
  return getComponentRoundness("button");
}

// Helper function to get card appearance styles for the language switcher
function getLanguageSwitcherCardAppearance(): string {
  const themeConfig = getThemeConfig();
  const appearance = APPEARANCE_STYLES[themeConfig.appearance];
  return appearance?.card || APPEARANCE_STYLES.flat.card; // Fallback to flat design
}

export function LanguageSwitcher({ languages }: { languages: Lang[] }) {
  const currentLocale = useLocale();
  const switcherRoundness = getLanguageSwitcherRoundness();
  const cardAppearance = getLanguageSwitcherCardAppearance();

  const [selected, setSelected] = useState(languages.find((l) => l.code === currentLocale) || languages[0]);

  const router = useRouter();

  const handleChange = async (language: Lang) => {
    setSelected(language);
    const newLocale = language.code;

    await setLanguageCookie(newLocale);

    router.refresh();
  };

  return (
    <Listbox value={selected} onChange={handleChange}>
      <ListboxButton
        className={clsx(
          `text-foreground hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center gap-1.5 px-2.5 text-sm ${switcherRoundness}`,
          cardAppearance,
          "data-[focus]:ring-ring/50 transition-[color,background-color,box-shadow] outline-none data-[focus]:ring-[3px]",
        )}
      >
        <GlobeIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">{selected.name}</span>
        <span className="uppercase sm:hidden">{selected.code}</span>
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-3.5 shrink-0" aria-hidden="true" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom end"
        transition
        className={clsx(
          `bg-popover text-popover-foreground border-border z-50 max-h-48 min-w-40 overflow-y-auto rounded-md border p-1 shadow-md [--anchor-gap:6px] [--anchor-max-height:12rem] focus:outline-none`,
          "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0",
        )}
      >
        {languages.map((lang) => (
          <ListboxOption
            key={lang.code}
            value={lang}
            className={`group data-[focus]:bg-accent data-[focus]:text-accent-foreground flex cursor-default items-center gap-2 px-2 py-1.5 text-sm select-none ${switcherRoundness}`}
          >
            <CheckIcon className="invisible size-4 group-data-[selected]:visible" />
            <div>{lang.name}</div>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
