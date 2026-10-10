"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Account } from "@vq/contracts";
import { accountRequest } from "@vq/api-client";
type AccountState = {
  account: Account | null;
  loading: boolean;
  unavailable: boolean;
  authenticate: (
    action: "login" | "register",
    input: { email: string; password: string },
  ) => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<AccountState | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let live = true;
    accountRequest("/api", "me")
      .then((result) => {
        if (live) {
          setAccount(result.account);
          setUnavailable(false);
        }
      })
      .catch(() => {
        if (live) setUnavailable(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);
  async function authenticate(
    action: "login" | "register",
    input: { email: string; password: string },
  ) {
    const result = await accountRequest("/api", action, input);
    setAccount(result.account);
    setUnavailable(false);
  }
  async function logout() {
    await accountRequest("/api", "logout");
    setAccount(null);
    setUnavailable(false);
  }
  return (
    <Context.Provider
      value={{ account, loading, unavailable, authenticate, logout }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  const context = useContext(Context);
  if (!context) throw new Error("AccountProvider is required.");
  return context;
}
