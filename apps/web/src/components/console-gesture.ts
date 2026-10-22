export interface ConsolePoint {
  x: number;
  time: number;
}

// The reference PanSession measures velocity over the last 100ms, in px/second.
export function consoleVelocity(points: ConsolePoint[]) {
  const end = points.at(-1);
  if (!end) return 0;
  let start = end;
  for (let i = points.length - 2; i >= 0; i--) {
    start = points[i];
    if (end.time - start.time >= 100) break;
  }
  const elapsed = end.time - start.time;
  return elapsed > 0 ? ((end.x - start.x) / elapsed) * 1000 : 0;
}

export function shouldCloseConsole(offset: number, velocity: number) {
  return offset > 80 || velocity > 300;
}
