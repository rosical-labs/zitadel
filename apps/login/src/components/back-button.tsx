"use client";

import { buttonClasses } from "@/digisat/ui/button-styles";
import { useRouter } from "next/navigation";
import { Translated } from "./translated";

export function BackButton() {
  const router = useRouter();
  return (
    // digisat: "Geri" is a secondary action in the step card, so it is a ghost button, never a second outline or primary
    <button onClick={() => router.back()} type="button" className={buttonClasses("ghost", "lg")}>
      <Translated i18nKey="back" namespace="common" />
    </button>
  );
}
