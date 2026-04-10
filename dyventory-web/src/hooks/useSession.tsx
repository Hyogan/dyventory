"use client";

import { useSessionContext } from "@/providers/SessionProvider";
import type { AuthUser } from "@/types/auth";
import type { UserRole } from "@/types";

interface UseSessionReturn {
  user: AuthUser | null;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
}

export function useSession(): UseSessionReturn {
  const { user } = useSessionContext();
  //   console.log("HERE_IS_THE_USE_SESSION_USER", user);

  return {
    user,
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => user !== null && roles.includes(user.role),
    isAdmin: () => user?.role === "admin",
    isManager: () => user?.role === "manager",
  };
}
