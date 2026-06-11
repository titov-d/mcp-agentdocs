/** Central configuration. No magic values elsewhere in the codebase. */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

export const SERVER_NAME = "agentdocs";
export const SERVER_VERSION = "0.1.0";

/** Retrieval tuning. */
export const MAX_RESULTS = 8;

/**
 * Freshness policy: a doc must be re-verified against its source at least this
 * often, even if the source hasn't changed. Used by scripts/check-freshness.ts.
 */
export const MAX_VERIFIED_AGE_DAYS = 30;
/** Characters of context shown around the first match in a snippet. */
export const SNIPPET_RADIUS = 240;

/**
 * Absolute path to the shipped corpus directory.
 * At runtime this file lives in dist/, and corpus/ ships at the package root,
 * so the corpus is one level up from dist/.
 */
export function corpusDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "corpus");
}
