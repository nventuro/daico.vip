// =============================================================================
// Searching the local store: text matching that ignores case and accents (so
// "noquis" finds "Ñoquis"), and one pass over a table's rows on top of it. An
// app's adapter says which columns it searches and what a hit reads like; the
// store is the device's own, so search works with no connection.
// =============================================================================
import type { AttachmentOwnerKind, SyncedRow } from '../types';
import type { SearchHit } from '../apps/types';
import * as engine from './offline/engine';
import { ATTACHMENTS_SPEC, type TableSpec } from './offline/specs';
import { normalize } from '../utils/textUtils';

/** Characters shown either side of a match in a search result excerpt. */
export const SEARCH_EXCERPT_RADIUS = 40;

const ELLIPSIS = '…';

/** Whether `text` contains `query`, ignoring case and accents. Empty or missing text never matches. */
export function matches(text: string | null | undefined, query: string): boolean {
  if (!text) return false;
  return normalize(text).includes(normalize(query));
}

/**
 * A short window of `text` around its first match of `query`: up to `radius`
 * characters either side, with whitespace runs collapsed to one space and an
 * ellipsis wherever the text was cut. When nothing matches, the head of the
 * text (twice `radius`) instead.
 */
export function excerpt(text: string, query: string, radius: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  const needle = normalize(query);
  const at = normalize(flat).indexOf(needle);
  const [start, end] =
    at === -1 ? [0, 2 * radius] : [Math.max(0, at - radius), at + needle.length + radius];
  const head = start > 0 ? ELLIPSIS : '';
  const tail = end < flat.length ? ELLIPSIS : '';
  return `${head}${flat.slice(start, end)}${tail}`;
}

/** What an app's search does with one of its tables. */
interface TableSearch<Row extends SyncedRow> {
  /** The text columns that are searched, in the order they are tried. */
  fields: (keyof Row & string)[];
  /** What a matching row reads like, told which of its fields matched. */
  hit: (row: Row, matched: keyof Row & string) => SearchHit;
  /** Set when the app's entries take attachments: those named like the
   *  query follow the entries, each under the entry it belongs to. */
  attachments?: AttachmentOwnerKind;
}

/**
 * The rows of `spec` that mention `query` in one of `fields`, as hits — then,
 * for an app whose entries take attachments, those named so. Nothing
 * is capped here: how many results an app contributes is the shell's to say.
 */
export async function searchTable<Row extends SyncedRow>(
  spec: TableSpec<Row>,
  query: string,
  { fields, hit, attachments }: TableSearch<Row>,
): Promise<SearchHit[]> {
  const rows = await engine.listVisible(spec);
  const hits = rows.flatMap((row): SearchHit[] => {
    const matched = fields.find((field) => matches(String(row[field] ?? ''), query));
    return matched ? [hit(row, matched)] : [];
  });
  if (!attachments) return hits;
  const owners = new Map(rows.map((row) => [row.id, hit(row, fields[0])]));
  return [...hits, ...(await searchAttachments(attachments, query, owners))];
}

/**
 * The attachments of `kind` whose name mentions `query`, each shown under the
 * entry it belongs to: `owners` maps an entry's id to its own hit, and an
 * attachment of an entry not in it is left out.
 */
async function searchAttachments(
  kind: AttachmentOwnerKind,
  query: string,
  owners: Map<string, SearchHit>,
): Promise<SearchHit[]> {
  const attachments = await engine.listVisible(ATTACHMENTS_SPEC);
  return attachments.flatMap((attachment) => {
    const owner = attachment.owner_kind === kind ? owners.get(attachment.owner_id) : undefined;
    return owner && matches(attachment.name, query)
      ? [{ title: attachment.name, subtitle: owner.title, to: `${owner.to}/${attachment.id}` }]
      : [];
  });
}
