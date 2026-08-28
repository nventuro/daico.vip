import { useCallback, useEffect, useState } from 'react';
import type { MerchantRule, SpendingCategory } from '../../types';
import { normalize } from '../../lib/search';
import { MERCHANT_RULES_SPEC } from '../../lib/offline/specs';
import * as engine from '../../lib/offline/engine';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { useMasterKey } from '../../hooks/useMasterKey';
import { openPattern, sealPattern } from './payload';
import type { Rule } from './rules';

// A pattern is unsealed once per version of its row.
const opened = new Map<string, Promise<string>>();

function pattern(rule: MerchantRule, masterKey: CryptoKey): Promise<string> {
  const key = `${rule.id}:${rule.updated_at}`;
  let promise = opened.get(key);
  if (!promise) {
    promise = openPattern(masterKey, rule);
    opened.set(key, promise);
    promise.catch(() => opened.delete(key));
  }
  return promise;
}

/** Local-first merchant rules with their patterns in the clear, undefined
 *  until every one is unsealed. Adding or changing one seals the pattern on
 *  the device; `addMany` takes rules in bulk, moving a rule that already has
 *  the pattern to the category given rather than doubling it, and never
 *  removes one. Every action is instant and works offline. */
export function useMerchantRules() {
  const { items, loading, error, mutate } = useOfflineTable<MerchantRule>(MERCHANT_RULES_SPEC);
  const masterKey = useMasterKey();
  const [rules, setRules] = useState<Rule[] | undefined>();

  useEffect(() => {
    if (masterKey.status !== 'unlocked') return;
    let active = true;
    Promise.all(
      items.map(async (row) => ({
        id: row.id,
        category: row.category,
        pattern: await pattern(row, masterKey.key),
      })),
    ).then((unsealed) => {
      if (active) setRules(unsealed);
    });
    return () => {
      active = false;
    };
  }, [items, masterKey]);

  const add = useCallback(
    (text: string, category: SpendingCategory, key: CryptoKey) =>
      mutate(async () =>
        engine.insert(MERCHANT_RULES_SPEC, { ...(await sealPattern(key, text)), category }),
      ),
    [mutate],
  );

  const save = useCallback(
    (id: string, patch: { pattern?: string; category?: SpendingCategory }, key: CryptoKey) =>
      mutate(async () =>
        engine.update(MERCHANT_RULES_SPEC, id, {
          ...(patch.category ? { category: patch.category } : {}),
          ...(patch.pattern === undefined ? {} : await sealPattern(key, patch.pattern)),
        }),
      ),
    [mutate],
  );

  const addMany = useCallback(
    (entries: { pattern: string; category: SpendingCategory }[], key: CryptoKey) =>
      mutate(async () => {
        const existing = new Map(
          (rules ?? []).map((rule) => [normalize(rule.pattern.trim()), rule]),
        );
        for (const { pattern, category } of entries) {
          const found = existing.get(normalize(pattern));
          if (!found) {
            await engine.insert(MERCHANT_RULES_SPEC, {
              ...(await sealPattern(key, pattern)),
              category,
            });
          } else if (found.category !== category) {
            await engine.update(MERCHANT_RULES_SPEC, found.id, { category });
          }
        }
      }),
    [mutate, rules],
  );

  const remove = useCallback(
    (id: string) => mutate(() => engine.remove(MERCHANT_RULES_SPEC, id)),
    [mutate],
  );

  return { rules, loading, error, add, addMany, save, remove };
}
