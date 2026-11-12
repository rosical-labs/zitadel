"use client";

import { isExternalUrl, isSafeRedirectUri } from "@/lib/client-utils";
import { usePathname } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isAccessDenied } from "./access-denied-result";
import { Handoff } from "./ui/handoff";
import { NoAccess } from "./ui/no-access";

// The handoff only appears when leaving takes noticeable time; an instant redirect never shows it.
export const HANDOFF_DELAY_MS = 400;

type Override = { kind: "handoff" } | { kind: "noAccess" };

type StepOverride = {
  showHandoffAfterDelay: () => void;
  showNoAccess: () => void;
};

const StepOverrideContext = createContext<StepOverride | null>(null);

/**
 * Replaces the step (title block and form) with the handoff or the no-access view. The step stays mounted but
 * hidden, so nothing it holds (e.g. a SAML auto-submit form) is torn down. A view belongs to the page it was
 * shown on: after a client navigation to another path, the new page shows again.
 */
export function StepOverrideProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [override, setOverride] = useState<(Override & { pathname: string }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showHandoffAfterDelay = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOverride({ kind: "handoff", pathname }), HANDOFF_DELAY_MS);
  }, [pathname]);

  const showNoAccess = useCallback(() => {
    clearTimeout(timer.current);
    setOverride({ kind: "noAccess", pathname });
  }, [pathname]);

  useEffect(() => {
    // Back from the target app may restore this page from the bfcache: show the step again, not the handoff.
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        clearTimeout(timer.current);
        setOverride(null);
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ showHandoffAfterDelay, showNoAccess }), [showHandoffAfterDelay, showNoAccess]);
  const active = override && override.pathname === pathname ? override : null;

  return (
    <StepOverrideContext.Provider value={value}>
      {active?.kind === "handoff" && <Handoff />}
      {active?.kind === "noAccess" && <NoAccess />}
      <div hidden={!!active}>{children}</div>
    </StepOverrideContext.Provider>
  );
}

// Whether a completion result navigates out of the login app (validated as the navigation will be).
function leavesLogin(result: unknown): boolean {
  if (typeof result !== "object" || result === null || !("redirect" in result)) {
    return false;
  }
  const url = result.redirect;
  return typeof url === "string" && isExternalUrl(url) && isSafeRedirectUri(url);
}

/**
 * For the places that act on a completed sign-in. `withCompletionView(result, navigate)`:
 * - no access to the application: shows the no-access view instead of navigating (the form's error path)
 *   and returns true, as handleServerActionResponse does for a handled result;
 * - otherwise runs `navigate` exactly as before, returns what it returns and, if the result leaves the login app,
 *   shows the handoff after the delay.
 * Without the provider (unit tests of a single form) it only runs `navigate`.
 */
export function useCompletionView() {
  const stepOverride = useContext(StepOverrideContext);

  return useCallback(
    function withCompletionView(result: unknown, navigate: () => boolean | void): boolean | void {
      if (!stepOverride) {
        return navigate();
      }
      if (isAccessDenied(result)) {
        stepOverride.showNoAccess();
        return true;
      }
      if (leavesLogin(result)) {
        stepOverride.showHandoffAfterDelay();
      }
      return navigate();
    },
    [stepOverride],
  );
}
