/** Pure freshness-evaluation logic (no IO). Unit-tested in __tests__/freshness.test.ts. */

/** Whole days from one YYYY-MM-DD date to another (UTC). */
export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.parse(`${fromISO}T00:00:00Z`);
  const b = Date.parse(`${toISO}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** A doc is stale when its verification is older than the allowed ceiling. */
export function isStale(verifiedAt: string, today: string, maxAgeDays: number): boolean {
  return daysBetween(verifiedAt, today) > maxAgeDays;
}

export type DriftStatus = "ok" | "drift" | "unseeded";

/**
 * Compare a stored source snapshot against the current source.
 * Inputs must already be normalized. `null` snapshot = no baseline yet.
 */
export function classifyDrift(snapshot: string | null, current: string): DriftStatus {
  if (snapshot === null) return "unseeded";
  return snapshot === current ? "ok" : "drift";
}
