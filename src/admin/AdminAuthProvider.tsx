import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { repositories } from "@/services";
import { AdminAuthContext, type AdminAuthContextType, type AdminAuthStatus } from "./adminAuthContext";

const SESSION_CHECK_MS = 30_000;

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth } = repositories;
  const [status, setStatus] = useState<AdminAuthStatus>("loading");

  const refresh = useCallback(async () => {
    if (!(await auth.isConfigured())) setStatus("needs-setup");
    else setStatus(auth.isAuthenticated() ? "signed-in" : "signed-out");
  }, [auth]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // A sessão expira sozinha: sai da área restrita sem precisar de nova ação do usuário.
  useEffect(() => {
    if (status !== "signed-in") return;
    const timer = setInterval(() => {
      if (!auth.isAuthenticated()) setStatus("signed-out");
    }, SESSION_CHECK_MS);
    return () => clearInterval(timer);
  }, [status, auth]);

  const value = useMemo<AdminAuthContextType>(
    () => ({
      status,
      async setup(password) {
        await auth.setup(password);
        setStatus("signed-in");
      },
      async login(password) {
        const ok = await auth.login(password);
        if (ok) setStatus("signed-in");
        return ok;
      },
      logout() {
        auth.logout();
        setStatus("signed-out");
      },
      changePassword: (current, next) => auth.changePassword(current, next),
    }),
    [status, auth],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};
