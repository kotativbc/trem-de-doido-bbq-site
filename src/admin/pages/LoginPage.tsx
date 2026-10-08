import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_ADMIN_PASSWORD_LENGTH } from "@/services/repositories";
import { useAdminAuth } from "../adminAuthContext";

const LoginPage = ({ mode }: { mode: "setup" | "login" }) => {
  const { setup, login } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSetup = mode === "setup";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (isSetup) {
      if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
        setError(`A senha precisa ter ao menos ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`);
        return;
      }
      if (password !== confirm) {
        setError("As senhas não são iguais.");
        return;
      }
    }
    setBusy(true);
    try {
      if (isSetup) await setup(password);
      else if (!(await login(password))) setError("Senha incorreta.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-[#111111] p-6" noValidate>
        <div className="text-center">
          <Flame className="mx-auto mb-2 h-8 w-8 text-primary" aria-hidden="true" />
          <h1 className="font-['Bebas_Neue'] text-3xl tracking-wide">{isSetup ? "CRIAR SENHA DO PAINEL" : "ENTRAR NO PAINEL"}</h1>
        </div>

        {isSetup && (
          <p className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-xs text-amber-300">
            Modo demonstração: a senha fica guardada só neste navegador. Ela impede acesso casual, mas não é segurança de
            verdade. Para usar em produção, conecte um servidor com autenticação.
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="admin-password">{isSetup ? "Nova senha" : "Senha"}</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete={isSetup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>

        {isSetup && (
          <div className="space-y-1.5">
            <Label htmlFor="admin-confirm">Repita a senha</Label>
            <Input id="admin-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" disabled={busy || password === ""} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
          {busy ? "Aguarde…" : isSetup ? "Criar senha e entrar" : "Entrar"}
        </Button>
        <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
          Voltar ao site
        </Link>
      </form>
    </main>
  );
};

export default LoginPage;
