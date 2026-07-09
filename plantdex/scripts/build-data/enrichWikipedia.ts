// Pulls a plant's "Pokédex blurb" (flavor text) + lead image + Wikidata id
// from the Wikipedia REST summary endpoint — one call gives all three.

import { fetchJsonCached } from "./net";

export interface WikiSummary {
  extract: string;
  imageUrl?: string;
  thumbUrl?: string;
  wikidataId?: string;
  canonicalTitle?: string;
}

interface RawSummary {
  type?: string;
  title?: string;
  extract?: string;
  thumbnail?: { source: string };
  originalimage?: { source: string };
  wikibase_item?: string;
}

/** Trim a Wikipedia extract down to a punchy 1–2 sentence dex blurb. */
function toFlavorText(extract: string): string {
  const clean = extract.replace(/\s+/g, " ").trim();
  if (clean.length <= 220) return clean;
  // cut at the end of the sentence nearest ~200 chars
  const slice = clean.slice(0, 240);
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("! "));
  if (lastStop > 120) return slice.slice(0, lastStop + 1);
  return slice.slice(0, 200).trimEnd() + "…";
}

export async function getWikiSummary(
  title: string,
): Promise<WikiSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title,
  )}?redirect=true`;
  const raw = await fetchJsonCached<RawSummary>(url);
  if (!raw || !raw.extract) return null;
  return {
    extract: toFlavorText(raw.extract),
    imageUrl: raw.originalimage?.source ?? raw.thumbnail?.source,
    thumbUrl: raw.thumbnail?.source,
    wikidataId: raw.wikibase_item,
    canonicalTitle: raw.title,
  };
}
