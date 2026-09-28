"use client";

import { setLanguageCookie } from "@/lib/cookies";
import { Lang } from "@/lib/i18n";
import { APPEARANCE_STYLES, getComponentRoundness, getThemeConfig } from "@/lib/theme";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
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
    <div className="w-32">
      <Listbox value={selected} onChange={handleChange}>
        <ListboxButton
          className={clsx(
            `text-foreground relative block h-9 w-full pr-8 pl-3 text-left text-sm ${switcherRoundness}`,
            cardAppearance,
            "data-[focus]:ring-ring/50 transition-[color,box-shadow] outline-none data-[focus]:ring-[3px]",
          )}
        >
          {selected.name}
          <ChevronDownIcon
            className="group text-muted-foreground pointer-events-none absolute top-2.5 right-2.5 size-4"
            aria-hidden="true"
          />
        </ListboxButton>
        <ListboxOptions
          anchor="bottom"
          transition
          className={clsx(
            `bg-popover text-popover-foreground border-border z-50 max-h-48 w-[var(--button-width)] overflow-y-auto rounded-md border p-1 shadow-md [--anchor-gap:6px] [--anchor-max-height:12rem] focus:outline-none`,
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
    </div>
  );
}
