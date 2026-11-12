import { StepOverrideProvider } from "@/digisat/step-override";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PasswordForm } from "./password-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  // digisat: the step override provider reads the path and the no-access step the organization
  usePathname: () => "/password",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/password", () => ({
  sendPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

// digisat: the no-access step asks for the hub link
vi.mock("@/digisat/hub-url", () => ({
  getHubUrl: vi.fn().mockResolvedValue(undefined),
}));

describe("PasswordForm", () => {
  afterEach(cleanup);

  test("should autofocus the password input on mount", () => {
    const { getByTestId } = render(<PasswordForm loginSettings={undefined} loginName="test@example.com" />);
    expect(getByTestId("password-text-input")).toHaveFocus();
  });

  // digisat: a user without access gets the no-access step, not a password field error
  test("replaces the step with the no-access step when the user has no access to the application", async () => {
    const { sendPassword } = await import("@/lib/server/password");
    vi.mocked(sendPassword).mockResolvedValue({ error: "no grant", accessDenied: true } as never);

    render(
      <StepOverrideProvider>
        <PasswordForm loginSettings={undefined} loginName="test@example.com" requestId="oidc_1" />
      </StepOverrideProvider>,
    );

    fireEvent.change(screen.getByTestId("password-text-input"), { target: { value: "Password1!" } });
    await waitFor(() => expect(screen.getByTestId("submit-button")).not.toBeDisabled());
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(screen.getByTestId("no-access")).toBeInTheDocument());
    expect(sendPassword).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("password-text-input")).not.toBeVisible();
    expect(screen.getByTestId("password-text-input")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("no grant")).toBeNull();
  });
});
