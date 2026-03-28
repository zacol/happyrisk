const MULTIPLIERS: Record<string, number> = {
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
};

export function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)([dhms])$/);

  if (!match) throw new Error(`Invalid duration format: ${duration}`);

  return parseInt(match[1], 10) * MULTIPLIERS[match[2]];
}
