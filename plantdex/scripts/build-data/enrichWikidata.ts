// Image attribution from Wikimedia Commons + a P18 image fallback from
// Wikidata (used when the Wikipedia summary has no lead image).

import { fetchJsonCached, stripHtml } from "./net";
import type { ImageAttribution } from "../../src/types/plant";

/** Extract the Commons file name from an upload.wikimedia.org URL. */
export function fileNameFromUploadUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    // .../commons/thumb/a/ab/Name.jpg/640px-Name.jpg  -> Name.jpg (2nd-to-last)
    // .../commons/a/ab/Name.jpg                        -> Name.jpg (last)
    const isThumb = parts.includes("thumb");
    const name = isThumb ? parts[parts.length - 2] : parts[parts.length - 1];
    return name ? decodeURIComponent(name) : null;
  } catch {
    return null;
  }
}

/** Stable, resizable Commons URL for a given file name. */
export function commonsFilePath(fileName: string, width?: number): string {
  const base = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    fileName,
  )}`;
  return width ? `${base}?width=${width}` : base;
}

interface CommonsImageInfo {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }
    >;
  };
}

export async function getCommonsAttribution(
  fileName: string,
): Promise<ImageAttribution | null> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&prop=imageinfo&iiprop=extmetadata|url&origin=*` +
    `&titles=${encodeURIComponent("File:" + fileName)}`;
  const raw = await fetchJsonCached<CommonsImageInfo>(url);
  const pages = raw?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  const license =
    stripHtml(meta.LicenseShortName?.value) ??
    stripHtml(meta.License?.value) ??
    "See source";
  return {
    license,
    licenseUrl: stripHtml(meta.LicenseUrl?.value),
    author: stripHtml(meta.Artist?.value),
    sourceUrl:
      info.descriptionurl ??
      `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`,
    title: stripHtml(meta.ObjectName?.value) ?? fileName.replace(/\.[a-z]+$/i, ""),
  };
}

interface EntityData {
  entities?: Record<
    string,
    {
      claims?: {
        P18?: Array<{ mainsnak?: { datavalue?: { value?: string } } }>;
      };
    }
  >;
}

/** Fallback: pull the P18 (image) file name from a Wikidata entity. */
export async function getWikidataImageFile(qid: string): Promise<string | null> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const raw = await fetchJsonCached<EntityData>(url);
  const entity = raw?.entities?.[qid];
  const file = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return file ?? null;
}
