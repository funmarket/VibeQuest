import type { KeyboardEvent } from "react";

// Automatic activation follows visual arrow direction, including RTL rails.
export function tabKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (!keys.includes(event.key)) return;
  const rail = event.currentTarget;
  const buttons = [...rail.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const index = buttons.indexOf(event.target as HTMLButtonElement);
  if (index < 0 || !buttons.length) return;
  const rtl = getComputedStyle(rail).direction === "rtl";
  const direction = (event.key === "ArrowRight" ? 1 : -1) * (rtl ? -1 : 1);
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? buttons.length - 1
        : (index + direction + buttons.length) % buttons.length;
  event.preventDefault();
  buttons[next].focus();
  buttons[next].click();
}
