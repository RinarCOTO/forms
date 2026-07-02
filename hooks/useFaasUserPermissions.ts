"use client";

import { useEffect, useMemo, useState } from "react";

interface UseFaasUserPermissionsOptions {
  submitRoles?: readonly string[];
  printRoles?: readonly string[];
  historyRoles?: readonly string[];
  logErrors?: boolean;
}

export function useFaasUserPermissions({
  submitRoles = [],
  printRoles = [],
  historyRoles = [],
  logErrors = false,
}: UseFaasUserPermissionsOptions) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/users/permissions")
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled && data?.role) setRole(data.role);
      })
      .catch((error) => {
        if (logErrors) console.error("[permissions] fetch failed:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [logErrors]);

  return useMemo(() => ({
    role,
    canSubmit: !!role && submitRoles.includes(role),
    canPrint: !!role && printRoles.includes(role),
    canViewHistory: !!role && historyRoles.includes(role),
  }), [historyRoles, printRoles, role, submitRoles]);
}
