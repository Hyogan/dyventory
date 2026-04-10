"use client";

import { createContext, useContext } from "react";
import type { AuthUser } from "@/types/auth";

interface SessionContextValue {
  user: AuthUser | null;
}

const SessionContext = createContext<SessionContextValue>({ user: null });

export function SessionProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  //   console.log("HERE_IS_THE_SESSION_PROVIDER_USER", user);

  return (
    <SessionContext.Provider value={{ user }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextValue {
  return useContext(SessionContext);
}
