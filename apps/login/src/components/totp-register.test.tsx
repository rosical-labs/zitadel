import { verifyTOTP } from "@/lib/server/verify";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TotpRegister } from "./totp-register";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/verify", () => ({
  verifyTOTP: vi.fn(),
}));

vi.mock("@/lib/client", () => ({
  handleServerActionResponse: vi.fn(),
  completeFlowOrGetUrl: vi.fn(),
}));

vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => <svg data-testid="qr-code" data-value={value} />,
}));

describe("TotpRegister", () => {
  afterEach(cleanup);

  test("should autofocus the code input on mount", () => {
    const { getByTestId } = render(<TotpRegister uri="otpauth://totp/test" secret="SECRET" />);
    expect(getByTestId("code-text-input")).toHaveFocus();
  });

  // digisat: the six code boxes submit on the sixth digit, like the TOTP login step
  test("verifies the code once when the sixth digit is entered, without clicking the button", async () => {
    vi.mocked(verifyTOTP).mockRejectedValue(new Error("invalid code"));
    const { getByTestId, findByText } = render(<TotpRegister uri="otpauth://totp/test" secret="SECRET" />);

    const input = getByTestId("code-text-input");
    fireEvent.change(input, { target: { value: "12345" } });
    expect(verifyTOTP).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: "123 456" } });

    await waitFor(() => expect(verifyTOTP).toHaveBeenCalledTimes(1));
    expect(vi.mocked(verifyTOTP).mock.calls[0][0]).toBe("123456");
    expect(await findByText("invalid code")).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  test("shows the secret for manual entry", () => {
    const { getByTestId } = render(<TotpRegister uri="otpauth://totp/test" secret="SECRET" />);
    expect(getByTestId("totp-secret")).toHaveTextContent("SECRET");
  });
});
