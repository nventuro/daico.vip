import { useMemo, useState } from 'react';
import { SPENDING_CATEGORIES } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import { ADD_BAR_CLASS } from '../../components/controlClasses';
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
    <>
      <ListPage
        loading={loading || !rules}
        error={error}
        bar={
          <div className={ADD_BAR_CLASS}>
            <Button
              onClick={() => setPasting(true)}
              disabled={masterKey.status !== 'unlocked'}
              className="w-full py-3"
            >
              Pegar reglas
            </Button>
          </div>
        }
      >
        {rules?.length === 0 ? (
          <EmptyState>
            Todavía no hay reglas. Se escriben desde un movimiento de un resumen, o se pegan de a
            muchas.
          </EmptyState>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(({ category, rules: own }) => (
              <div key={category}>
                <SectionLabel detail={own.length}>{CATEGORY_LABELS[category]}</SectionLabel>
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
      </ListPage>
      {pasting && masterKey.status === 'unlocked' && (
        <RulesImportDialog
          onSave={(entries) => addMany(entries, masterKey.key)}
          onClose={() => setPasting(false)}
        />
      )}
    </>
  );
}
