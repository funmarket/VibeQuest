"use client";
import type { ReactNode } from "react";
import { ThemeProvider } from "@vq/ui/theme";
import { HostProvider, useHost } from "../platform/host";
import { AreaProvider } from "../features/explore/area-provider";
import { GeoProvider } from "../features/geo/geo-provider";
import { AccessDialog } from "../features/geo/access-dialog";
import { AccountProvider } from "../features/identity/account-provider";

function ThemeBridge({ children }: { children: ReactNode }) {
  const host = useHost();
  return <ThemeProvider hostScheme={host.scheme}>{children}</ThemeProvider>;
}
export function Providers({ children }: { children: ReactNode }) {
  return (
    <HostProvider>
      <ThemeBridge>
        <AccountProvider>
          <AreaProvider>
            <GeoProvider>
              {children}
              <AccessDialog />
            </GeoProvider>
          </AreaProvider>
        </AccountProvider>
      </ThemeBridge>
    </HostProvider>
  );
}
