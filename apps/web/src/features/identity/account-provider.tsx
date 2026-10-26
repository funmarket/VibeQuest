"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
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
  const channel = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const connection = new BroadcastChannel("vq.identity");
    channel.current = connection;
    connection.onmessage = (event) => {
      const data = event.data;
      if (!data || data.accountId !== account?.id) return;
      if (data.kind === "signing-out")
        window.dispatchEvent(new Event("vq:signing-out"));
      else if (data.kind === "signed-out") {
        window.dispatchEvent(new Event("vq:signing-out"));
        setAccount(null);
      } else if (data.kind === "signout-failed")
        window.dispatchEvent(new Event("vq:signout-failed"));
    };
    return () => {
      connection.close();
      if (channel.current === connection) channel.current = null;
    };
  }, [account?.id]);
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
    const accountId = account?.id;
    window.dispatchEvent(new Event("vq:signing-out"));
    channel.current?.postMessage({ kind: "signing-out", accountId });
    try {
      await accountRequest("/api", "logout");
    } catch (error) {
      window.dispatchEvent(new Event("vq:signout-failed"));
      channel.current?.postMessage({ kind: "signout-failed", accountId });
      throw error;
    }
    channel.current?.postMessage({ kind: "signed-out", accountId });
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
