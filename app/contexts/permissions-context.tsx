"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface PermissionsState {
  role: string | null;
  permissions: Record<string, boolean>;
  loading: boolean;
  refresh: () => void;
}

const PermissionsContext = createContext<PermissionsState>({
  role: null,
  permissions: {},
  loading: true,
  refresh: () => {},
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchPerms = useCallback(() => {
    setLoading(true);
    fetch("/api/my-permissions")
      .then((res) => res.json())
      .then((data) => {
        setRole(data.role ?? null);
        setPermissions(data.permissions ?? {});
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchPerms();
  }, [fetchPerms]);

  // Allow other parts of the app to trigger a permissions refresh (e.g. after role change)
  useEffect(() => {
    const handler = () => fetchPerms();
    window.addEventListener("user-role-updated", handler);
    return () => window.removeEventListener("user-role-updated", handler);
  }, [fetchPerms]);

  return (
    <PermissionsContext.Provider value={{ role, permissions, loading, refresh: fetchPerms }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
