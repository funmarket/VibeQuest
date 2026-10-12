import { describe, expect, it } from "vitest";
import { advanceNavigationScroll } from "../../apps/web/src/components/navigation-scroll";

describe("bottom navigation scroll visibility", () => {
  it("hides after accumulated downward movement and shows on upward movement", () => {
    let state = { anchor: 0, hidden: false };
    state = advanceNavigationScroll(state, 12);
    expect(state.hidden).toBe(false);
    state = advanceNavigationScroll(state, 21);
    expect(state.hidden).toBe(true);
    state = advanceNavigationScroll(state, 80);
    state = advanceNavigationScroll(state, 70);
    expect(state.hidden).toBe(true);
    state = advanceNavigationScroll(state, 59);
    expect(state.hidden).toBe(false);
  });

  it("restores at the top and ignores tiny movements and overscroll", () => {
    expect(advanceNavigationScroll({ anchor: 100, hidden: true }, 9)).toEqual({
      anchor: 9,
      hidden: false,
    });
    expect(advanceNavigationScroll({ anchor: 100, hidden: true }, -10)).toEqual(
      {
        anchor: 0,
        hidden: false,
      },
    );
    expect(advanceNavigationScroll({ anchor: 50, hidden: false }, 70)).toEqual({
      anchor: 50,
      hidden: false,
    });
  });
});
