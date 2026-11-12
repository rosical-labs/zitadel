import { fieldHelpClasses } from "@/digisat/ui/field";
import { ReactNode } from "react";

type Props = {
  /** "Kod gelmedi mi?" */
  prompt: ReactNode;
  /** "Kodu tekrar gönder" */
  label: string;
  onClick: () => void;
  disabled?: boolean;
  "data-testid"?: string;
};

/** The resend action as one help-sized line under a code field, instead of a stacked info alert. */
export function ResendCode({ prompt, label, onClick, disabled, "data-testid": testId }: Props) {
  return (
    <p className={fieldHelpClasses}>
      {prompt}{" "}
      <button type="button" className="ztdl-link" disabled={disabled} onClick={onClick} data-testid={testId}>
        {label}
      </button>
    </p>
  );
}
