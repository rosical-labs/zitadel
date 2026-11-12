// Design system session list (.dg-sessions/.dg-session): one bordered card, rows split by hairlines.
export const sessionListClasses =
  "flex w-full flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-card empty:hidden";

export const sessionRowClasses =
  "flex min-h-14 w-full items-center gap-3 px-4 py-3 text-sm transition-colors outline-none hover:bg-accent focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";

// A row that is not a control (e.g. a method that is already set up): no hover, no focus.
export const sessionRowStaticClasses = "relative flex min-h-14 w-full items-center gap-3 px-4 py-3 text-sm";
