import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { LoginOTP } from "./login-otp";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/session", () => ({
  updateOrCreateSession: vi.fn(),
}));

vi.mock("@/lib/client", () => ({
  handleServerActionResponse: vi.fn(),
  completeFlowOrGetUrl: vi.fn(),
}));

describe("LoginOTP", () => {
  let mockUpdateOrCreateSession: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { updateOrCreateSession } = await import("@/lib/server/session");
    mockUpdateOrCreateSession = vi.mocked(updateOrCreateSession);
  });

  afterEach(cleanup);

  test("should autofocus the code input on mount", () => {
    const { getByTestId } = render(<LoginOTP host={null} method="time-based" />);
    expect(getByTestId("code-text-input")).toHaveFocus();
  });

  test("should display translated fallback error when OTP verification request rejects", async () => {
    // digisat: rejects every call, because the sixth digit already submits once before the click
    mockUpdateOrCreateSession.mockRejectedValue(new Error("network down"));

    render(<LoginOTP host={null} method="time-based" />);

    const input = screen.getByTestId("code-text-input");
    fireEvent.change(input, { target: { value: "123456" } });

    const submitButton = screen.getByTestId("submit-button");
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("errors.couldNotVerifyCode")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockUpdateOrCreateSession).toHaveBeenCalledTimes(2);
    });
  });

  test("submits a TOTP code once when the sixth digit is entered, without clicking the button", async () => {
    mockUpdateOrCreateSession.mockResolvedValue({ error: "invalid code" });

    render(<LoginOTP host={null} method="time-based" loginName="user@example.com" />);

    const input = screen.getByTestId("code-text-input");
    fireEvent.change(input, { target: { value: "12345" } });
    expect(mockUpdateOrCreateSession).not.toHaveBeenCalled();

    // A pasted code with a space still fills all six boxes.
    fireEvent.change(input, { target: { value: "123 456" } });

    await waitFor(() => {
      expect(mockUpdateOrCreateSession).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateOrCreateSession.mock.calls[0][0].checks.totp.code).toBe("123456");
    await waitFor(() => {
      expect(screen.getByText("invalid code")).toBeInTheDocument();
    });
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("does not auto-submit SMS codes, whose length is instance-configurable", async () => {
    mockUpdateOrCreateSession.mockResolvedValue({});

    render(<LoginOTP host={null} method="sms" loginName="user@example.com" />);

    // The SMS challenge request on mount is the only call.
    await waitFor(() => {
      expect(mockUpdateOrCreateSession).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId("code-text-input"), { target: { value: "12345678" } });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockUpdateOrCreateSession).toHaveBeenCalledTimes(1);
  });

  test("should display translated fallback error when OTP challenge request rejects", async () => {
    mockUpdateOrCreateSession.mockRejectedValueOnce(new Error("challenge request failed"));

    render(<LoginOTP host={null} method="sms" />);

    expect(screen.getByRole("button", { name: "verify.resendCode" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("errors.couldNotRequestChallenge")).toBeInTheDocument();
    });
  });
});
