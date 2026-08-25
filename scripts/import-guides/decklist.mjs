// Converts a plain-text decklist ("4 Counterspell" per line, sideboard after a
// blank line or a "Sideboard" marker) into markdown with two headed lists.

export function decklistToMarkdown(text) {
  const main = [];
  const side = [];
  let inSide = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      if (main.length) inSide = true;
      continue;
    }
    if (/^(sideboard|side)\b/i.test(line)) {
      inSide = true;
      continue;
    }
    if (/^(deck|main|mainboard|companion)\b/i.test(line)) continue;
    const m = line.match(/^(\d+)\s*x?\s+(.+)$/);
    if (!m) continue;
    (inSide ? side : main).push(`- ${m[1]} ${m[2].trim()}`);
  }
  const parts = [`## Principal`, ...main];
  if (side.length) parts.push('', `## Sideboard`, ...side);
  return parts.join('\n') + '\n';
}
