"use client";

import { buttonClasses } from "@/digisat/ui/button-styles";
import { clsx } from "clsx";
import { Loader2Icon } from "lucide-react";
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react";
import { useFormStatus } from "react-dom";

export type SignInWithIdentityProviderProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  name?: string;
  e2e?: string;
};

export const BaseButton = forwardRef<HTMLButtonElement, SignInWithIdentityProviderProps>(function BaseButton(props, ref) {
  const formStatus = useFormStatus();

  return (
    <button
      {...props}
      type="submit"
      ref={ref}
      disabled={formStatus.pending}
      // digisat: IdP/SSO buttons are the design system's full-width outline pills under "veya"
      className={clsx(buttonClasses("outline", "lg"), "min-w-0 flex-1", props.className)}
    >
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <div className="flex min-w-0 flex-row items-center">{props.children}</div>
        {formStatus.pending && <Loader2Icon className="h-4 w-4 animate-spin" />}
      </div>
    </button>
  );
});
