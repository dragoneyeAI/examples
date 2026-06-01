// Shared fetch helper for the build pipeline: polite to Wikimedia APIs
// (descriptive User-Agent + small delay) and caches raw JSON responses to
// .cache/ so re-runs are fast and don't hammer the servers.

import { createHash } from "node:crypto";
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(HERE, ".cache");

// Wikimedia asks bots/scripts to identify themselves with contact info.
const USER_AGENT =
  "PlantdexBuildScript/0.1 (https://github.com/dragoneye; example data build) node-fetch";

let lastRequestAt = 0;
const MIN_INTERVAL_MS = 120;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function cachePath(url: string): string {
  const h = createHash("sha1").update(url).digest("hex").slice(0, 16);
  return join(CACHE_DIR, `${h}.json`);
}

/** Fetch JSON with on-disk caching. Returns null on HTTP error / parse fail. */
export async function fetchJsonCached<T = unknown>(
  url: string,
): Promise<T | null> {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const cp = cachePath(url);
  if (existsSync(cp)) {
    try {
      return JSON.parse(readFileSync(cp, "utf8")) as T;
    } catch {
      /* fall through and re-fetch */
    }
  }

  const since = Date.now() - lastRequestAt;
  if (since < MIN_INTERVAL_MS) await delay(MIN_INTERVAL_MS - since);
  lastRequestAt = Date.now();

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(`  ! ${res.status} ${url}`);
      return null;
    }
    const json = (await res.json()) as T;
    writeFileSync(cp, JSON.stringify(json));
    return json;
  } catch (err) {
    console.warn(`  ! fetch failed ${url}: ${(err as Error).message}`);
    return null;
  }
}

/** Strip HTML tags + collapse whitespace (Commons metadata is HTML). */
export function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || undefined;
}
