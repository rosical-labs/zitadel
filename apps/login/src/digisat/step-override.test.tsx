import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { HANDOFF_DELAY_MS, StepOverrideProvider, useCompletionView } from "./step-override";

let pathname = "/password";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams("organization=org-1"),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("./hub-url", () => ({
  getHubUrl: vi.fn().mockResolvedValue("https://hub.example.com"),
}));

let product: string | undefined = "endpoint-control";

vi.mock("./product-provider", () => ({
  useProduct: () => product,
}));

const CALLBACK_URL = "https://auth.example.com/oauth/v2/authorize/callback?id=1";

// A step that completes with `result` and navigates the way handleServerActionResponse would.
function Step({ result, navigate }: { result: unknown; navigate: () => boolean | void }) {
  const withCompletionView = useCompletionView();
  return (
    <button type="button" onClick={() => withCompletionView(result, navigate)}>
      sign in
    </button>
  );
}

function renderStep(result: unknown, navigate: () => boolean | void) {
  return render(
    <StepOverrideProvider>
      <Step result={result} navigate={navigate} />
    </StepOverrideProvider>,
  );
}

describe("useCompletionView", () => {
  beforeEach(() => {
    pathname = "/password";
    product = "endpoint-control";
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  test("navigates at once and shows the handoff only after the delay when leaving the login app", () => {
    const push = vi.fn();
    renderStep({ redirect: CALLBACK_URL }, () => push(CALLBACK_URL));

    fireEvent.click(screen.getByText("sign in"));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(CALLBACK_URL);

    act(() => vi.advanceTimersByTime(HANDOFF_DELAY_MS - 1));
    expect(screen.queryByTestId("handoff")).toBeNull();
    expect(screen.getByText("sign in")).toBeVisible();

    act(() => vi.advanceTimersByTime(1));
    const handoff = screen.getByTestId("handoff");
    expect(handoff).toHaveAttribute("role", "status");
    expect(screen.getByRole("heading", { name: "title" })).toHaveFocus();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("sign in")).not.toBeVisible();
    expect(push).toHaveBeenCalledTimes(1);
  });

  test("shows no handoff for a navigation inside the login app", () => {
    const push = vi.fn();
    renderStep({ redirect: "/otp/time-based?loginName=a" }, () => push("/otp/time-based?loginName=a"));

    fireEvent.click(screen.getByText("sign in"));
    act(() => vi.advanceTimersByTime(HANDOFF_DELAY_MS * 5));

    expect(push).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("handoff")).toBeNull();
  });

  test("shows no handoff for an unsafe redirect, which the navigation blocks", () => {
    const navigate = vi.fn(() => true);
    renderStep({ redirect: "javascript:alert(1)" }, navigate);

    fireEvent.click(screen.getByText("sign in"));
    act(() => vi.advanceTimersByTime(HANDOFF_DELAY_MS * 5));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("handoff")).toBeNull();
  });

  test("shows the no-access step instead of navigating for a user without access", async () => {
    const navigate = vi.fn(() => true);
    renderStep({ error: "no grant", accessDenied: true }, navigate);

    fireEvent.click(screen.getByText("sign in"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByTestId("no-access")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "title" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "signOut" })).toHaveAttribute("href", "/logout?organization=org-1");
    expect(screen.getByRole("link", { name: "hub" })).toHaveAttribute("href", "https://hub.example.com");
    expect(screen.getByRole("link", { name: "signOut" }).className).toContain("border-input");
    expect(screen.getByText("sign in")).not.toBeVisible();
  });

  test("offers only sign-out, as the primary action, when no product is known", async () => {
    product = undefined;
    const { getHubUrl } = await import("./hub-url");
    vi.mocked(getHubUrl).mockClear();
    renderStep({ error: "no grant", accessDenied: true }, vi.fn());

    fireEvent.click(screen.getByText("sign in"));
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByText("generic")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "hub" })).toBeNull();
    expect(getHubUrl).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "signOut" }).className).toContain("bg-primary");
  });

  test("treats a plain error as before: navigate handles it", () => {
    const navigate = vi.fn(() => true);
    renderStep({ error: "wrong password" }, navigate);

    fireEvent.click(screen.getByText("sign in"));

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("no-access")).toBeNull();
  });

  test("shows the step again after a client navigation to another path", () => {
    const push = vi.fn();
    const { rerender } = renderStep({ redirect: CALLBACK_URL }, () => push(CALLBACK_URL));

    fireEvent.click(screen.getByText("sign in"));
    act(() => vi.advanceTimersByTime(HANDOFF_DELAY_MS));
    expect(screen.getByTestId("handoff")).toBeInTheDocument();

    pathname = "/signedin";
    rerender(
      <StepOverrideProvider>
        <Step result={{ redirect: CALLBACK_URL }} navigate={() => push(CALLBACK_URL)} />
      </StepOverrideProvider>,
    );

    expect(screen.queryByTestId("handoff")).toBeNull();
    expect(screen.getByText("sign in")).toBeVisible();
  });

  test("only navigates without the provider", () => {
    const navigate = vi.fn(() => false);
    render(<Step result={{ error: "no grant", accessDenied: true }} navigate={navigate} />);

    fireEvent.click(screen.getByText("sign in"));

    expect(navigate).toHaveBeenCalledTimes(1);
  });
});
