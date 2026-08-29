import { describe, it, expect } from 'vitest';
import { decklistToMarkdown } from './decklist.mjs';

describe('decklistToMarkdown', () => {
  it('splits main deck and sideboard on a blank line', () => {
    expect(decklistToMarkdown('Deck\n4 A\n2 B\n\n3 C\n')).toBe(
      '## Principal\n- 4 A\n- 2 B\n\n## Sideboard\n- 3 C\n',
    );
  });
  it('accepts a Sideboard marker', () => {
    expect(decklistToMarkdown('4 A\nSideboard\n1 C')).toBe(
      '## Principal\n- 4 A\n\n## Sideboard\n- 1 C\n',
    );
  });
});
