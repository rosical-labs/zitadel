import { sessionListClasses, sessionRowClasses } from "@/digisat/ui/list-styles";
import Link from "next/link";

export function SelfServiceMenu() {
  const list: any[] = [];

  // if (!!config.selfservice.change_password.enabled) {
  //   list.push({
  //     link:
  //       `/me/change-password?` +
  //       new URLSearchParams({
  //         sessionId: sessionId,
  //       }),
  //     name: "Change password",
  //   });
  // }

  return (
    // digisat: the items as design system session rows
    <div className={sessionListClasses}>
      {list.map((menuitem, index) => {
        return <SelfServiceItem link={menuitem.link} key={"self-service-" + index} name={menuitem.name} />;
      })}
    </div>
  );
}

const SelfServiceItem = ({ name, link }: { name: string; link: string }) => {
  return (
    <Link prefetch={false} href={link} className={sessionRowClasses}>
      {name}
    </Link>
  );
};
