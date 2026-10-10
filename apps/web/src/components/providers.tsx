"use client";
import type { ReactNode } from "react";
import { ThemeProvider } from "@vq/ui/theme";
import { HostProvider, useHost } from "../platform/host";
import { AccountProvider } from "../features/identity/account-provider";

function ThemeBridge({ children }: { children: ReactNode }) {
  const host = useHost();
  return <ThemeProvider hostScheme={host.scheme}>{children}</ThemeProvider>;
}
export function Providers({ children }: { children: ReactNode }) {
  return (
    <HostProvider>
      <ThemeBridge>
        <AccountProvider>{children}</AccountProvider>
      </ThemeBridge>
    </HostProvider>
  );
}
