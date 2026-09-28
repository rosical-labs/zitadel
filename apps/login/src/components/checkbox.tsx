import classNames from "clsx";
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, useEffect, useState } from "react";

export type CheckboxProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  checked: boolean;
  disabled?: boolean;
  onChangeVal?: (checked: boolean) => void;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className = "", checked = false, disabled = false, onChangeVal, children, ...props },
  ref,
) {
  const [enabled, setEnabled] = useState<boolean>(checked);

  useEffect(() => {
    setEnabled(checked);
  }, [checked]);

  return (
    <div className="relative flex items-start">
      <div className="flex h-5 items-center">
        <div className="box-sizing block">
          <input
            ref={ref}
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target?.checked);
              if (onChangeVal) onChangeVal(event.target?.checked);
            }}
            disabled={disabled}
            type="checkbox"
            className={classNames(
              "form-checkbox text-primary checked:border-primary border-input focus:border-ring focus:ring-ring/50 dark:bg-input/30 size-4 shrink-0 cursor-pointer rounded-sm bg-transparent shadow-xs transition-shadow focus:ring-[3px] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
            {...props}
          />
        </div>
      </div>
      {children}
    </div>
  );
});
