import { useState, type ReactNode } from 'react';
import { useMasterKey } from '../../hooks/useMasterKey';
import type { Movement } from './breakdown';
import { categoryOf } from './rules';
import type { useMerchantRules } from './useMerchantRules';
import RuleDialog, { type RuleChange } from './RuleDialog';

/**
 * Filing a movement from wherever it is listed: `select` opens the dialog on
 * one, `dialog` is what that puts on the screen. Saving writes the
 * household's rule, which files every statement at once — so the rules come
 * from the caller's own store rather than a second copy of it.
 */
export function useRuleDialog(store: ReturnType<typeof useMerchantRules>): {
  select: (movement: Movement) => void;
  dialog: ReactNode;
} {
  const masterKey = useMasterKey();
  const [selected, setSelected] = useState<Movement | null>(null);
  const rules = store.rules ?? [];
  const filing = selected ? categoryOf(selected.line, rules) : null;

  async function save(change: RuleChange) {
    if (masterKey.status !== 'unlocked' || !selected) return;
    const { rule } = categoryOf(selected.line, rules);
    if (rule) await store.save(rule.id, change, masterKey.key);
    else await store.add(change.pattern, change.category, masterKey.key);
    setSelected(null);
  }

  async function remove() {
    if (!selected) return;
    const { rule } = categoryOf(selected.line, rules);
    if (rule) await store.remove(rule.id);
    setSelected(null);
  }

  return {
    select: setSelected,
    dialog:
      selected && filing ? (
        <RuleDialog
          key={`${selected.statementId}-${selected.index}`}
          line={selected.line}
          cents={selected.cents}
          rule={filing.rule}
          category={filing.category}
          onSave={(change) => void save(change)}
          onRemove={() => void remove()}
          onClose={() => setSelected(null)}
        />
      ) : null,
  };
}
