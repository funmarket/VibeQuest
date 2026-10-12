export interface NavigationScrollState {
  anchor: number;
  hidden: boolean;
}

// Reference interaction: tolerate 20px of movement, always reveal near the top.
export function advanceNavigationScroll(
  state: NavigationScrollState,
  position: number,
): NavigationScrollState {
  const current = Math.max(0, position);
  if (current < 10) return { anchor: current, hidden: false };
  const movement = current - state.anchor;
  return Math.abs(movement) > 20
    ? { anchor: current, hidden: movement > 0 }
    : state;
}
