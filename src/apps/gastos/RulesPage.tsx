import { useMemo, useState } from 'react';
import { SPENDING_CATEGORIES } from '../../types';
import { useMasterKey } from '../../hooks/useMasterKey';
import OfflineBanner from '../../components/OfflineBanner';
import SkeletonRows from '../../components/SkeletonRows';
import SectionLabel from '../../components/SectionLabel';
import Button from '../../components/Button';
import { useMerchantRules } from './useMerchantRules';
import { CATEGORY_LABELS } from './labels';
import type { Rule } from './rules';
import RulesImportDialog from './RulesImportDialog';

/** The household's merchant rules, category by category, and where a batch
 *  of them is pasted in. A single rule is written from a line of a statement. */
export default function RulesPage() {
  const { rules, loading, error, addMany } = useMerchantRules();
  const masterKey = useMasterKey();
  const [pasting, setPasting] = useState(false);

  const groups = useMemo(() => {
    const byCategory = new Map<Rule['category'], Rule[]>();
    for (const rule of rules ?? []) {
      byCategory.set(rule.category, [...(byCategory.get(rule.category) ?? []), rule]);
    }
    return SPENDING_CATEGORIES.flatMap((category) => {
      const own = byCategory.get(category);
      return own
        ? [{ category, rules: own.sort((a, b) => a.pattern.localeCompare(b.pattern)) }]
        : [];
    });
  }, [rules]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading || !rules ? (
          <SkeletonRows />
        ) : rules.length === 0 ? (
          <p className="py-10 text-center text-muted">
            Todavía no hay reglas. Se escriben desde un movimiento de un resumen, o se pegan de a
            muchas.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(({ category, rules: own }) => (
              <div key={category}>
                <SectionLabel>
                  {CATEGORY_LABELS[category]} · {own.length}
                </SectionLabel>
                <ul>
                  {own.map((rule) => (
                    <li key={rule.id} className="truncate border-b border-border py-2">
                      {rule.pattern}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur">
        <Button
          onClick={() => setPasting(true)}
          disabled={masterKey.status !== 'unlocked'}
          className="w-full py-3"
        >
          Pegar reglas
        </Button>
      </div>

      {pasting && masterKey.status === 'unlocked' && (
        <RulesImportDialog
          onSave={(entries) => addMany(entries, masterKey.key)}
          onClose={() => setPasting(false)}
        />
      )}
    </div>
  );
}
