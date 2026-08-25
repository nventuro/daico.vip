import { createHash } from 'node:crypto';

// Fixed namespace so every import derives the same ids for the same source
// objects: re-importing updates rows in place instead of duplicating them, and
// links between chapters stay valid.
const NAMESPACE = 'a2b1f3c4-6d5e-4f70-9a8b-1c2d3e4f5a6b';

/** RFC 4122 version-5 (SHA-1, name-based) UUID within the importer's namespace. */
export function stableId(name) {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(Buffer.concat([ns, Buffer.from(name, 'utf8')])).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const h = hash.subarray(0, 16).toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
