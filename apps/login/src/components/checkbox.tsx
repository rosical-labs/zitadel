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
              // digisat: design system checkbox (18px, 5px radius, input border, card fill; ink when checked, ring outline on focus)
              "form-checkbox border-input bg-card text-primary checked:border-primary focus-visible:outline-ring size-[18px] shrink-0 cursor-pointer rounded-[5px] transition-colors focus:ring-0 focus:ring-offset-0 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
