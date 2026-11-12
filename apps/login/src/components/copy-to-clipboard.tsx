"use client";

import { buttonClasses } from "@/digisat/ui/button-styles";
import { ClipboardDocumentCheckIcon, ClipboardIcon } from "@heroicons/react/20/solid";
import copy from "copy-to-clipboard";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type Props = {
  value: string;
};

export function CopyToClipboard({ value }: Props) {
  const [copied, setCopied] = useState(false);
  // digisat: the icon-only button gets a name, and says when it copied
  const t = useTranslations("digisat");

  useEffect(() => {
    if (copied) {
      copy(value);
      const to = setTimeout(setCopied, 1000, false);
      return () => clearTimeout(to);
    }
  }, [copied, value]);

  return (
    <div className="flex shrink-0 flex-row items-center">
      <button
        id="tooltip-ctc"
        type="button"
        // digisat: design system ghost icon button
        className={buttonClasses("ghost", "icon")}
        aria-label={copied ? t("copy.copied") : t("copy.copy")}
        onClick={() => setCopied(true)}
      >
        {!copied ? (
          <ClipboardIcon className="text-muted-foreground size-4" aria-hidden="true" />
        ) : (
          <ClipboardDocumentCheckIcon className="text-success size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
