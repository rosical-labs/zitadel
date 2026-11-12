import { clsx } from "clsx";
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactNode } from "react";

// Design system Input: label above (500 13px), 36px control, help or error below (12px).
// The control text is 16px below md so iOS does not zoom on focus (DS: 14px), as upstream did.
export const fieldLabelClasses = "text-[13px] leading-[18px] font-medium select-none";
export const fieldHelpClasses = "text-xs leading-4 text-muted-foreground";
export const fieldErrorClasses = "text-xs leading-4 text-destructive";

export function inputClasses({ invalid = false, mono = false }: { invalid?: boolean; mono?: boolean } = {}): string {
  return clsx(
    "h-9 w-full min-w-0 rounded-sm border bg-card px-3 text-base text-foreground transition-[color,box-shadow] outline-none md:text-sm placeholder:text-muted-foreground focus:outline-2 focus:outline-offset-1 focus:outline-ring disabled:pointer-events-none disabled:opacity-50",
    // focus:ring-0 and the focus border keep @tailwindcss/forms' blue focus ring and border off; the outline is the focus.
    invalid ? "border-destructive focus:border-destructive" : "border-input focus:border-input",
    "focus:ring-0",
    mono && "font-mono",
  );
}

export function fieldHelpId(id: string): string {
  return `${id}-help`;
}

export function fieldErrorId(id: string): string {
  return `${id}-error`;
}

// The aria-describedby value for a control inside <Field>: its help and error lines, when shown.
export function fieldDescribedBy(id: string, { help, error }: { help?: ReactNode; error?: ReactNode }): string | undefined {
  const ids = [help ? fieldHelpId(id) : null, error ? fieldErrorId(id) : null].filter((value) => value !== null);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

type FieldProps = {
  /** The id of the control in children; the label points at it and the help/error ids derive from it. */
  id: string;
  label: ReactNode;
  /** Shown at the right of the label row, e.g. "Şifremi unuttum". Comes after the control in the DOM (focus order). */
  labelAside?: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  /** data-testid on a wrapper around the error, for upstream acceptance tests that read `[data-testid=error] div`. */
  errorTestId?: string;
  children: ReactNode;
};

/** A labelled field. The control in children must carry `id` and `aria-describedby={fieldDescribedBy(id, …)}`. */
export function Field({ id, label, labelAside, help, error, errorTestId, children }: FieldProps) {
  const labelElement = (
    <label htmlFor={id} className={fieldLabelClasses}>
      {label}
    </label>
  );
  const messages = (
    <>
      {help && (
        <p id={fieldHelpId(id)} className={fieldHelpClasses}>
          {help}
        </p>
      )}
      {error && <FieldError id={id} error={error} testId={errorTestId} />}
    </>
  );

  if (!labelAside) {
    return (
      <div className="flex flex-col gap-1.5">
        {labelElement}
        {children}
        {messages}
      </div>
    );
  }

  // DOM order label → control → aside keeps the aside after the control for focus and reading;
  // the grid places the aside at the label's right.
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5">
      <div className="col-start-1 row-start-1">{labelElement}</div>
      <div className="col-span-2 row-start-2">{children}</div>
      <div className="col-start-2 row-start-1">{labelAside}</div>
      <div className="col-span-2 flex flex-col gap-1.5 empty:hidden">{messages}</div>
    </div>
  );
}

// A <div> (not <p>) so the message can sit in the testid wrapper the acceptance tests expect.
export function FieldError({ id, error, testId }: { id: string; error: ReactNode; testId?: string }) {
  const message = (
    <div id={fieldErrorId(id)} role="alert" className={fieldErrorClasses}>
      {error}
    </div>
  );
  return testId ? <div data-testid={testId}>{message}</div> : message;
}

type InputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  invalid?: boolean;
  /** Technical values (codes, keys) in the mono face. */
  mono?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, mono = false, className, ...props },
  ref,
) {
  return (
    <input
      // Password managers add attributes before hydration, as upstream TextInput allows for.
      suppressHydrationWarning
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(inputClasses({ invalid, mono }), className)}
      {...props}
    />
  );
});
