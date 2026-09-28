"use client";

import { ClipboardDocumentCheckIcon, ClipboardIcon } from "@heroicons/react/20/solid";
import copy from "copy-to-clipboard";
import { useEffect, useState } from "react";

type Props = {
  value: string;
};

export function CopyToClipboard({ value }: Props) {
  const [copied, setCopied] = useState(false);

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
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-md transition-colors outline-none focus-visible:ring-[3px]"
        onClick={() => setCopied(true)}
      >
        {!copied ? <ClipboardIcon className="size-4" /> : <ClipboardDocumentCheckIcon className="size-4" />}
      </button>
    </div>
  );
}
