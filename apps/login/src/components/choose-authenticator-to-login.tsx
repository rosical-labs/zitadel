import { sessionListClasses } from "@/digisat/ui/list-styles";
import { LoginSettings, PasskeysType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { PASSKEYS, PASSWORD } from "./auth-methods";
import { Translated } from "./translated";

type Props = {
  authMethods: AuthenticationMethodType[];
  params: URLSearchParams;
  loginSettings: LoginSettings | undefined;
};

export function ChooseAuthenticatorToLogin({ authMethods, params, loginSettings }: Props) {
  return (
    <>
      {authMethods.includes(AuthenticationMethodType.PASSWORD) && loginSettings?.allowLocalAuthentication && (
        <div className="ztdl-p">
          <Translated i18nKey="chooseAlternativeMethod" namespace="idp" />
        </div>
      )}
      {/* digisat: the methods as design system session rows */}
      <div className={sessionListClasses}>
        {authMethods.includes(AuthenticationMethodType.PASSWORD) &&
          loginSettings?.allowLocalAuthentication &&
          PASSWORD(false, "/password?" + params, "row")}
        {authMethods.includes(AuthenticationMethodType.PASSKEY) &&
          loginSettings?.allowLocalAuthentication &&
          loginSettings?.passkeysType == PasskeysType.ALLOWED &&
          PASSKEYS(false, "/passkey?" + params, "row")}
      </div>
    </>
  );
}
