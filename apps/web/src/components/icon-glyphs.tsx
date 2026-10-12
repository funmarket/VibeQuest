import { createLucideIcon, Wallet, type LucideProps } from "lucide-react";

// Reference-specific geometry only. Display size, stroke, fill and tone remain
// owned by @vq/ui/icons.css; 24 here is the SVG coordinate space, not UI sizing.
export const HomeGlyph = createLucideIcon({
  name: "home",
  size: 24,
  node: [
    ["path", { d: "m2 10 10-7 10 7", key: "roof" }],
    ["path", { d: "M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9", key: "walls" }],
    ["path", { d: "M9 21v-7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7", key: "door" }],
    ["path", { d: "M19 4v4", key: "chimney" }],
  ],
});

export function WalletGlyph(props: LucideProps) {
  return (
    <Wallet {...props}>
      <path key="clasp" d="M18 14h.01" />
    </Wallet>
  );
}
