"use client";

import { clsx } from "clsx";
import { ChangeEvent, DetailedHTMLProps, FocusEvent, forwardRef, InputHTMLAttributes, useState } from "react";

export const CODE_LENGTH = 6;

const BOX_INDEXES = Array.from({ length: CODE_LENGTH }, (_, index) => index);

type Props = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  "type" | "value" | "defaultValue" | "inputMode" | "pattern"
> & {
  /** The current code, for drawing the boxes; the input itself stays uncontrolled (react-hook-form). */
  code: string;
  invalid?: boolean;
  /** Called when a change completes the code (typed or pasted); not again while the complete code stays the same. */
  onComplete?: (code: string) => void;
};

/**
 * Design system six-digit code (3 + 3 mono boxes). One real input lies over the boxes, so paste, autofill
 * ("one-time-code") and screen readers see a single text field; the boxes are only its picture.
 */
export const CodeInput = forwardRef<HTMLInputElement, Props>(function CodeInput(
  { code, invalid = false, onComplete, onChange, onFocus, onBlur, className, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    // Digits only, cut to six here rather than by maxLength, so a pasted "123 456" still fills all boxes.
    const digits = event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    event.target.value = digits;
    onChange?.(event);
    if (digits.length === CODE_LENGTH && digits !== code) {
      onComplete?.(digits);
    }
  }

  function handleFocus(event: FocusEvent<HTMLInputElement>) {
    setFocused(true);
    onFocus?.(event);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setFocused(false);
    onBlur?.(event);
  }

  return (
    <div className="relative">
      <div aria-hidden="true" className="flex gap-2">
        {BOX_INDEXES.map((index) => (
          <CodeBox
            key={index}
            digit={code.charAt(index)}
            active={focused && index === activeIndex}
            invalid={invalid}
            gapBefore={index === CODE_LENGTH / 2}
          />
        ))}
      </div>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        aria-invalid={invalid || undefined}
        className={clsx(
          // border-0/p-0/ring-0 undo the @tailwindcss/forms text-input look; the boxes draw the focus.
          "absolute inset-0 size-full cursor-text border-0 bg-transparent p-0 text-transparent caret-transparent outline-none selection:bg-transparent focus:ring-0",
          className,
        )}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </div>
  );
});

function CodeBox({
  digit,
  active,
  invalid,
  gapBefore,
}: {
  digit: string;
  active: boolean;
  invalid: boolean;
  gapBefore: boolean;
}) {
  return (
    <>
      {gapBefore && <span className="w-2 flex-none" />}
      <span
        className={clsx(
          "bg-card flex h-[52px] min-w-0 flex-1 items-center justify-center rounded-sm border font-mono text-[22px] leading-7 font-medium",
          invalid ? "border-destructive" : "border-input",
          active && "outline-ring outline-2 outline-offset-1",
        )}
      >
        {digit}
      </span>
    </>
  );
}
