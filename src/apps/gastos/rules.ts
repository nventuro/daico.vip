// =============================================================================
// Which category a movement is filed under. The merchant line the bank prints
// is boiled down to a key — the merchant's name without the payment
// processor's prefix, reference numbers and currency tails — and a rule is a
// piece of text that key contains, the longest match winning. Every rule is
// the household's own: where it shops is private, so nothing here knows a
// merchant. The bank's own charges are always taxes.
// =============================================================================
import { MERCHANT_PATTERN_MAX, SPENDING_CATEGORIES, type SpendingCategory } from '../../types';
import { normalize } from '../../lib/search';
import { CATEGORY_LABELS } from './labels';
import type { StatementLine } from './statement';

/** A merchant rule as the app works with it: the pattern in the clear. */
export interface Rule {
  id: string;
  pattern: string;
  category: SpendingCategory;
}

/** A payment processor's tag glued to the front of a merchant ("MERPAGO*X"). */
const PROCESSOR_PREFIX = /^[^\s*]+\*(?=\S)/;
const CURRENCY = /^(USD|GBP|EUR|U\$S)$/i;
/** A reference code with a currency glued to its end ("QpWzgfLkMUSD"). */
const CODE_WITH_CURRENCY = /^\S*[a-z]\S*(USD|GBP|EUR)$/;
/** Fewest letters a name glued to a code must have to be taken for one. */
const GLUED_NAME_MIN = 3;

/**
 * The merchant's name as printed, freed of what changes from one purchase to
 * the next: processor prefixes, reference numbers, a foreign amount. What a
 * rule is matched against, and what a new rule is offered as.
 */
export function merchantKey(description: string): string {
  let s = description.replace(/\([^)]*\)/g, ' ').trim();
  while (PROCESSOR_PREFIX.test(s)) s = s.replace(PROCESSOR_PREFIX, '');
  const words = s.replace(/\*/g, ' ').split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (const word of words) {
    if (CURRENCY.test(word) || CODE_WITH_CURRENCY.test(word)) break;
    if (/\d/.test(word)) {
      // A name glued to a code keeps the name: the head before the digits
      // ("RODAR7719…", "ANDINA0130…"), or what follows a code in front when
      // that is letters alone ("2210KIOSCOS"; "6173KQZMTB4" is all code). A
      // code's own letters, mixed-case and short, are dropped with it, and a
      // currency glued to one ("738201455USD") ends the name like a
      // currency on its own.
      const unnumbered = word.replace(/^\d+/, '');
      if (CURRENCY.test(unnumbered)) break;
      const head =
        unnumbered !== word && /\d/.test(unnumbered) ? '' : unnumbered.replace(/\d.*$/, '');
      if (head.length >= GLUED_NAME_MIN && head === head.toUpperCase()) kept.push(head);
      continue;
    }
    kept.push(word);
  }
  return kept.join(' ').toUpperCase();
}

/** The category a movement is filed under and the household's rule that
 *  filed it, if one did; null when nothing places it. */
export function categoryOf(
  line: StatementLine,
  rules: Rule[],
): { category: SpendingCategory | null; rule: Rule | null } {
  if (line.charge) return { category: 'impuestos', rule: null };
  const key = normalize(merchantKey(line.description));
  let best: Rule | null = null;
  for (const rule of rules) {
    const pattern = normalize(rule.pattern.trim());
    if (pattern && key.includes(pattern) && (!best || pattern.length > best.pattern.length)) {
      best = rule;
    }
  }
  return best ? { category: best.category, rule: best } : { category: null, rule: null };
}

/** Rules as pasted in bulk: the ones read, and the lines that are not one. */
export interface ParsedRules {
  rules: { pattern: string; category: SpendingCategory }[];
  problems: { line: number; text: string }[];
}

/** The category a word names, by its id or as it is shown; null for none. */
function categoryNamed(word: string): SpendingCategory | null {
  const wanted = normalize(word);
  return (
    SPENDING_CATEGORIES.find(
      (c) => normalize(c) === wanted || normalize(CATEGORY_LABELS[c]) === wanted,
    ) ?? null
  );
}

/**
 * Rules written one per line, the merchant text first and its category last
 * ("MERPAGO KIOSCOS supermercado"). Blank lines are skipped; a merchant given
 * twice keeps its last category.
 */
export function parseRulesText(text: string): ParsedRules {
  const byPattern = new Map<string, ParsedRules['rules'][number]>();
  const problems: ParsedRules['problems'] = [];
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const at = line.lastIndexOf(' ');
    const pattern = line.slice(0, at).trim();
    const category = at < 0 ? null : categoryNamed(line.slice(at + 1));
    if (!pattern || !category || pattern.length > MERCHANT_PATTERN_MAX) {
      problems.push({ line: i + 1, text: line });
      return;
    }
    byPattern.set(normalize(pattern), { pattern, category });
  });
  return { rules: [...byPattern.values()], problems };
}
