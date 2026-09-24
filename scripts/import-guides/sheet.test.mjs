import { describe, it, expect } from 'vitest';
import { splitSheet } from './sheet.mjs';

const sheet = (matchups) =>
  matchups.map((m) => `### ${m}\n\n- Card X: +2\n\n---\n\n- Card Y: -2\n`).join('\n');

describe('splitSheet', () => {
  it('reads a document of matchup headings as a sheet', () => {
    const split = splitSheet(`[Decklist](https://e.test/l)\n\n${sheet(['A', 'B', 'C'])}`);
    expect(split.intro).toBe('[Decklist](https://e.test/l)');
    expect(split.matchups.map((m) => m.title)).toEqual(['A', 'B', 'C']);
    expect(split.matchups[0].body).toBe('- Card X: +2\n\n---\n\n- Card Y: -2');
  });

  it('keeps a matchup with nothing under it', () => {
    const split = splitSheet(`${sheet(['A', 'B'])}\n### C\n`);
    expect(split.matchups[2]).toEqual({ title: 'C', body: '' });
  });

  it('leaves a document of fewer headings alone', () => {
    expect(splitSheet(sheet(['A', 'B']))).toBeNull();
  });

  it('leaves a table alone', () => {
    expect(splitSheet('| Matchup | Plan |\n| --- | --- |\n| A | Go fast |\n')).toBeNull();
  });
});
