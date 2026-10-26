"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { boundsSchema, type PlacesQuery } from "@vq/contracts";
const initialBounds = {
  west: 10.1,
  east: 10.3,
  south: 36.7,
  north: 36.9,
  limit: 50,
};
type Area = {
  bounds: PlacesQuery;
  manual: boolean;
  select: (bounds: PlacesQuery) => void;
  followDevice: () => void;
};
const Context = createContext<Area | null>(null);
export function AreaProvider({ children }: { children: ReactNode }) {
  const [bounds, setBounds] = useState<PlacesQuery>(initialBounds),
    [manual, setManual] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem("vq.browse-area") ?? "null",
      );
      const parsed = boundsSchema.safeParse(stored);
      if (parsed.success) {
        setBounds(parsed.data);
        setManual(true);
      }
    } catch {
      /* Optional editorial preference unavailable. */
    }
  }, []);
  function select(next: PlacesQuery) {
    const parsed = boundsSchema.parse(next);
    setBounds(parsed);
    setManual(true);
    try {
      localStorage.setItem("vq.browse-area", JSON.stringify(parsed));
    } catch {
      /* The selected viewport still works in this session. */
    }
  }
  return (
    <Context.Provider
      value={{
        bounds,
        manual,
        select,
        followDevice: () => {
          setManual(false);
          try {
            localStorage.removeItem("vq.browse-area");
          } catch {
            /* Device browsing still works without storage. */
          }
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useArea() {
  const value = useContext(Context);
  if (!value) throw Error("AreaProvider required");
  return value;
}
