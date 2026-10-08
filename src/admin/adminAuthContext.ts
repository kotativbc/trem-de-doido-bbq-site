import { createContext, useContext } from "react";

export type AdminAuthStatus = "loading" | "needs-setup" | "signed-out" | "signed-in";

export interface AdminAuthContextType {
  status: AdminAuthStatus;
  /** Primeiro acesso: cria a senha e entra. */
  setup: (password: string) => Promise<void>;
  /** false = senha incorreta. Lança se estiver bloqueado por muitas tentativas. */
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  changePassword: (current: string, next: string) => Promise<boolean>;
}

export const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const useAdminAuth = (): AdminAuthContextType => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};
