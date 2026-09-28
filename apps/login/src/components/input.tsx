"use client";

import { getComponentRoundness } from "@/lib/theme";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { clsx } from "clsx";
import { ChangeEvent, DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactNode } from "react";

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
};

const styles = (error: boolean, disabled: boolean, roundnessClasses: string = "rounded-md") =>
  clsx(
    {
      "h-9 w-full min-w-0 grow border bg-transparent px-3 py-1 shadow-xs transition-[color,box-shadow] dark:bg-input/30": true,
      "text-base md:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus:ring-[3px]": true,
      "border-input focus:border-ring focus:ring-ring/50": !error,
      "border-warn-light-500 dark:border-warn-dark-500 focus:ring-destructive/20 dark:focus:ring-destructive/40": error,
      "pointer-events-none cursor-not-allowed opacity-50": disabled,
    },
    roundnessClasses, // Apply the full roundness classes directly
  );

// Helper function to get default input roundness from theme
function getDefaultInputRoundness(): string {
  return getComponentRoundness("input");
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
      ...props
    },
    ref,
  ) => {
    // Use theme-based roundness if not explicitly provided
    const actualRoundness = roundness || getDefaultInputRoundness();

    return (
      <label className="text-foreground relative flex flex-col gap-2 text-sm">
        <span className={`leading-none font-medium select-none ${error ? "text-destructive" : ""}`}>
          {label} {required && "*"}
        </span>
        <span className="relative flex">
          <input
            suppressHydrationWarning
            ref={ref}
            className={styles(!!error, !!disabled, actualRoundness)}
            defaultValue={defaultValue}
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete={props.autoComplete ?? "off"}
            onChange={(e) => onChange && onChange(e)}
            onBlur={(e) => onBlur && onBlur(e)}
            {...props}
          />

          {suffix && (
            <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              @{suffix}
            </span>
          )}
        </span>

        {error && <span className="text-destructive text-sm leading-snug">{error}</span>}

        {success && (
          <span className="flex flex-row items-center gap-1.5 text-sm text-green-600 dark:text-green-500">
            <CheckCircleIcon className="size-4 shrink-0" />
            <span>{success}</span>
          </span>
        )}
      </label>
    );
  },
);
