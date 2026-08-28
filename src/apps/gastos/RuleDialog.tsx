import { type FormEvent, useState } from 'react';
import { MERCHANT_PATTERN_MAX, SPENDING_CATEGORIES, type SpendingCategory } from '../../types';
import ModalDialog from '../../components/ModalDialog';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import LineRow from './LineRow';
import { CATEGORY_LABELS } from './labels';
import { merchantKey, type Rule } from './rules';
import type { StatementLine } from './statement';

/** A rule to write or rewrite for the line's merchant. */
export interface RuleChange {
  pattern: string;
  category: SpendingCategory;
}

interface RuleDialogProps {
  line: StatementLine;
  cents: number;
  /** The household's rule filing the line now, if one does. */
  rule: Rule | null;
  /** How the line is filed now: by its rule, or as a charge. */
  category: SpendingCategory | null;
  /** Keeps what changed: the rule to write, or `'remove'` to drop the one
   *  filing the line. */
  onSave: (change: RuleChange | 'remove') => void;
  /** Called when the dialog closes on its own (Escape, a phone's back gesture). */
  onClose: () => void;
}

/**
 * Files one line of a statement: the merchant pattern the rule will match
 * and its category (none chosen, the merchant's rule is dropped). Saving
 * writes the rule for every statement. Shown as a full screen on a phone, a
 * sheet on a wider screen.
 */
export default function RuleDialog({
  line,
  cents,
  rule,
  category: filed,
  onSave,
  onClose,
}: RuleDialogProps) {
  const [pattern, setPattern] = useState(rule?.pattern ?? merchantKey(line.description));
  const [category, setCategory] = useState<SpendingCategory | null>(filed);

  const text = pattern.trim();
  // A charge is filed by the bank, never by a rule.
  function ruleChange(): RuleChange | 'remove' | null {
    if (line.charge) return null;
    if (category === null) return rule ? 'remove' : null;
    if (text === '') return null;
    const same = rule && rule.pattern === text && rule.category === category;
    return same ? null : { pattern: text, category };
  }
  const change = ruleChange();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (change !== null) onSave(change);
  }

  return (
    <ModalDialog
      onClose={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-surface p-0 text-on-surface backdrop:bg-on-surface/50 sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:border sm:border-border"
    >
      <form onSubmit={handleSubmit} className="flex min-h-full flex-col gap-4 p-4">
        <span className="font-medium">{line.charge ? 'Percepción' : 'Categoría'}</span>
        <ul className="border-y border-border">
          <LineRow line={line} cents={cents} onSelect={() => {}} />
        </ul>

        {!line.charge && (
          <>
            <FormField label="Comercio">
              <TextInput
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                aria-label="Comercio"
                maxLength={MERCHANT_PATTERN_MAX}
                autoCapitalize="characters"
              />
              <span className="text-xs text-muted">
                La categoría se aplica a todo movimiento cuyo comercio contenga este texto, en todos
                los resúmenes.
              </span>
            </FormField>

            <FormField label="Categoría" group>
              <div className="flex flex-wrap gap-2">
                {SPENDING_CATEGORIES.map((option) => (
                  <Chip
                    key={option}
                    selected={category === option}
                    onClick={() => setCategory((current) => (current === option ? null : option))}
                  >
                    {CATEGORY_LABELS[option]}
                  </Chip>
                ))}
              </div>
            </FormField>
          </>
        )}

        <div className="mt-auto flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={change === null}>
            Guardar
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
