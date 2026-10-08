import { adminCredentialSchema } from "@/domain/schemas";
import { readJson, removeKey, writeJson } from "../storage";
import { MIN_ADMIN_PASSWORD_LENGTH, type AuthRepository } from "../repositories";

export const ADMIN_CREDENTIAL_KEY = "tdd.admin.v1";
export const ADMIN_SESSION_KEY = "tdd.admin.session";
const SESSION_HOURS = 8;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;
const PBKDF2_ITERATIONS = 150_000;

const toHex = (bytes: ArrayBuffer | Uint8Array): string =>
  Array.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");

const fromHex = (hex: string): Uint8Array => {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

const deriveHash = async (password: string, salt: Uint8Array, iterations: number): Promise<string> => {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("Este navegador não oferece a API de criptografia necessária (use HTTPS).");
  const key = await subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return toHex(bits);
};

const sessionStore = (): Storage | null => {
  try {
    return window.sessionStorage;
  } catch (error) {
    console.warn("[auth] sessionStorage indisponível:", error);
    return null;
  }
};

const startSession = (now: number): void => {
  sessionStore()?.setItem(ADMIN_SESSION_KEY, String(now + SESSION_HOURS * 3_600_000));
};

export const createLocalAuthRepository = (now: () => number = () => Date.now()): AuthRepository => {
  let failedAttempts = 0;
  let lockedUntil = 0;

  const verify = async (password: string): Promise<boolean> => {
    const credential = readJson(ADMIN_CREDENTIAL_KEY, adminCredentialSchema);
    if (!credential) return false;
    const hash = await deriveHash(password, fromHex(credential.salt), credential.iterations);
    return hash === credential.hash;
  };

  const store = async (password: string): Promise<void> => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await deriveHash(password, salt, PBKDF2_ITERATIONS);
    const ok = writeJson(ADMIN_CREDENTIAL_KEY, {
      salt: toHex(salt),
      hash,
      iterations: PBKDF2_ITERATIONS,
      createdAt: new Date(now()).toISOString(),
    });
    if (!ok) throw new Error("Não foi possível salvar a senha neste navegador.");
  };

  const assertStrong = (password: string): void => {
    if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      throw new Error(`A senha precisa ter ao menos ${MIN_ADMIN_PASSWORD_LENGTH} caracteres.`);
    }
  };

  return {
    async isConfigured() {
      return readJson(ADMIN_CREDENTIAL_KEY, adminCredentialSchema) !== null;
    },

    async setup(password: string) {
      if (readJson(ADMIN_CREDENTIAL_KEY, adminCredentialSchema)) throw new Error("A senha do painel já foi criada.");
      assertStrong(password);
      await store(password);
      startSession(now());
    },

    async login(password: string) {
      if (now() < lockedUntil) {
        const seconds = Math.ceil((lockedUntil - now()) / 1000);
        throw new Error(`Muitas tentativas. Aguarde ${seconds}s e tente de novo.`);
      }
      const ok = await verify(password);
      if (!ok) {
        failedAttempts += 1;
        if (failedAttempts >= MAX_ATTEMPTS) {
          failedAttempts = 0;
          lockedUntil = now() + LOCKOUT_MS;
        }
        return false;
      }
      failedAttempts = 0;
      startSession(now());
      return true;
    },

    logout() {
      sessionStore()?.removeItem(ADMIN_SESSION_KEY);
    },

    isAuthenticated() {
      const raw = sessionStore()?.getItem(ADMIN_SESSION_KEY);
      if (!raw) return false;
      const expiresAt = Number(raw);
      if (!Number.isFinite(expiresAt) || expiresAt <= now()) {
        sessionStore()?.removeItem(ADMIN_SESSION_KEY);
        return false;
      }
      return true;
    },

    async changePassword(current: string, next: string) {
      if (!(await verify(current))) return false;
      assertStrong(next);
      await store(next);
      return true;
    },
  };
};

/** Só para testes e para "esqueci a senha" em modo demo: apaga a senha deste navegador. */
export const resetLocalAdminCredential = (): void => {
  removeKey(ADMIN_CREDENTIAL_KEY);
  sessionStore()?.removeItem(ADMIN_SESSION_KEY);
};
