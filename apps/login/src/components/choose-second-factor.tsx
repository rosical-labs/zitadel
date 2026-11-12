"use client";

import { sessionListClasses } from "@/digisat/ui/list-styles";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { EMAIL, SMS, TOTP, U2F } from "./auth-methods";

type Props = {
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  userMethods: AuthenticationMethodType[];
};

export function ChooseSecondFactor({ loginName, sessionId, requestId, organization, userMethods }: Props) {
  const params = new URLSearchParams({});

  if (loginName) {
    params.append("loginName", loginName);
  }
  if (sessionId) {
    params.append("sessionId", sessionId);
  }
  if (requestId) {
    params.append("requestId", requestId);
  }
  if (organization) {
    params.append("organization", organization);
  }

  // digisat: the methods as design system session rows; a method without a row renders nothing
  return (
    <div className={sessionListClasses}>
      {userMethods.map((method) => {
        if (method === AuthenticationMethodType.TOTP) {
          return TOTP(false, "/otp/time-based?" + params, "row");
        }
        if (method === AuthenticationMethodType.U2F) {
          return U2F(false, "/u2f?" + params, "row");
        }
        if (method === AuthenticationMethodType.OTP_EMAIL) {
          return EMAIL(false, "/otp/email?" + params, "row");
        }
        if (method === AuthenticationMethodType.OTP_SMS) {
          return SMS(false, "/otp/sms?" + params, "row");
        }
        return null;
      })}
    </div>
  );
}
