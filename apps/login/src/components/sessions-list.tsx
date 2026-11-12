"use client";

import { sessionListClasses } from "@/digisat/ui/list-styles";
import { timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { ReactNode, useState } from "react";
import { Alert } from "./alert";
import { SessionItem } from "./session-item";
import { Translated } from "./translated";

type Props = {
  sessions: Session[];
  requestId?: string;
  /** digisat: the last row of the list ("Başka bir hesap kullan"). */
  lastRow?: ReactNode;
};

export function SessionsList({ sessions, requestId, lastRow }: Props) {
  const [list, setList] = useState<Session[]>(sessions);
  return sessions ? (
    // digisat: one design system session list; the accounts first, then the last row
    <div className={sessionListClasses}>
      {list
        .filter((session) => session?.factors?.user?.loginName)
        // sort by change date descending
        .sort((a, b) => {
          const dateA = a.changeDate ? timestampDate(a.changeDate).getTime() : 0;
          const dateB = b.changeDate ? timestampDate(b.changeDate).getTime() : 0;
          return dateB - dateA;
        })
        // TODO: add sorting to move invalid sessions to the bottom
        .map((session, index) => {
          return (
            <SessionItem
              session={session}
              requestId={requestId}
              reload={() => {
                setList(list.filter((s) => s.id !== session.id));
              }}
              key={"session-" + index}
            />
          );
        })}
      {lastRow}
    </div>
  ) : (
    <Alert>
      <Translated i18nKey="noResults" namespace="accounts" />
    </Alert>
  );
}
