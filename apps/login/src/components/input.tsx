"use client";

import { FieldError, fieldErrorId, fieldLabelClasses, inputClasses } from "@/digisat/ui/field";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { clsx } from "clsx";
import { ChangeEvent, CSSProperties, DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";

export type TextInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  label: string;
  suffix?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string | ReactNode;
  success?: string | ReactNode;
  disabled?: boolean;
  onChange?: (value: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (value: ChangeEvent<HTMLInputElement>) => void;
  roundness?: string; // Allow override via props
  errorTestId?: string; // digisat: testid wrapper around the error, as the acceptance tests locate it
};

// digisat: the design system input (36px, card fill, input border, 2px ring focus), see src/digisat/ui/field.tsx.
// Theme roundness no longer applies; an explicit roundness prop is appended after the 8px radius.
const styles = (error: boolean, disabled: boolean, roundnessClasses?: string) =>
  clsx(inputClasses({ invalid: error }), "grow", roundnessClasses, {
    "pointer-events-none cursor-not-allowed opacity-50": disabled,
  });

// Reserve room for "@suffix" (~1ch per character, at most half the field) so typed text never runs under it.
function suffixWidthStyle(suffix: string | undefined): CSSProperties | undefined {
  if (!suffix) {
    return undefined;
  }
  return { "--suffix-width": `min(${suffix.length + 1}ch + 0.75rem, 50%)` } as CSSProperties;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      placeholder,
      defaultValue,
      suffix,
      required = false,
      error,
      disabled,
      success,
      onChange,
      onBlur,
      roundness,
      errorTestId,
      ...props
    },
    ref,
  ) => {
    // digisat: an explicit label/id pair and error wiring (aria-invalid, aria-describedby, role="alert")
    const generatedId = useId();
    const id = props.id ?? generatedId;
    const errorId = fieldErrorId(id);

    return (
      <div className="text-foreground relative flex flex-col gap-1.5 text-sm">
        {/* digisat: no required asterisk (the design system shows none); the input keeps `required` */}
        <label htmlFor={id} className={clsx(fieldLabelClasses, error && "text-destructive")}>
          {label}
        </label>
        <span className="relative flex" style={suffixWidthStyle(suffix)}>
          <input
            suppressHydrationWarning
            ref={ref}
            className={clsx(styles(!!error, !!disabled, roundness), suffix && "pr-[calc(var(--suffix-width)+0.25rem)]")}
            defaultValue={defaultValue}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete={props.autoComplete ?? "off"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(e) => onChange && onChange(e)}
            onBlur={(e) => onBlur && onBlur(e)}
            {...props}
            id={id}
          />

          {suffix && (
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 max-w-(--suffix-width) truncate pr-3 leading-9">
              @{suffix}
            </span>
          )}
        </span>

        {error && <FieldError id={id} error={error} testId={errorTestId} />}

        {success && (
          <span className="text-success flex flex-row items-center gap-1.5 text-xs leading-4">
            <CheckCircleIcon className="size-4 shrink-0" />
            <span>{success}</span>
          </span>
        )}
      </div>
    );
  },
);
