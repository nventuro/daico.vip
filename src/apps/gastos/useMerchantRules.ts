import { useCallback, useEffect, useState } from 'react';
import { MERCHANT_RULES_SPEC, type SpendingCategory } from '../../lib/offline/specs';
import { errorMessage, normalize } from '../../utils/textUtils';
import * as engine from '../../lib/offline/engine';
import { useOfflineTable } from '../../hooks/useOfflineTable';
import { useMasterKey } from '../../hooks/useMasterKey';
import { openOnce } from './openOnce';
import { openPattern, sealPattern } from './payload';
import type { Rule } from './rules';

/** Local-first merchant rules with their patterns in the clear, undefined
 *  until every one is unsealed. Adding or changing one seals the pattern on
 *  the device; `addMany` takes rules in bulk, moving a rule that already has
 *  the pattern to the category given rather than doubling it, and never
 *  removes one. Sealing is part of the write, so it happens inside `mutate`
 *  like the write itself: what it fails at is reported on the screen, never
 *  thrown at the caller, which has nowhere to say it. Every action is instant
 *  and works offline. */
export function useMerchantRules() {
  const { items, loading, error, mutate, remove } = useOfflineTable(MERCHANT_RULES_SPEC);
  const masterKey = useMasterKey();
  const [rules, setRules] = useState<Rule[] | undefined>();
  // A pattern that will not open is said so: without it the screens waiting on
  // the rules would hold their place for a set that is never coming.
  const [openError, setOpenError] = useState<string | null>(null);

  useEffect(() => {
    if (masterKey.status !== 'unlocked') return;
    let active = true;
    Promise.all(
      items.map(async (row) => ({
        id: row.id,
        category: row.category,
        pattern: await openOnce(row, () => openPattern(masterKey.key, row)),
      })),
    ).then(
      (unsealed) => {
        if (active) {
          setRules(unsealed);
          setOpenError(null);
        }
      },
      (e: unknown) => {
        if (active) setOpenError(errorMessage(e));
      },
    );
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

  return { rules, loading, error: error ?? openError, add, addMany, save, remove };
}
