import { type FormEvent, useState } from 'react';
import { MERCHANT_PATTERN_MAX, SPENDING_CATEGORIES, type SpendingCategory } from '../../types';
import ModalDialog from '../../components/ModalDialog';
import FormField from '../../components/FormField';
import TextInput from '../../components/TextInput';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import FormFooter from '../../components/FormFooter';
import CheckSquare from '../../components/CheckSquare';
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
  last4: string | null;
  cents: number;
  /** The household's rule filing the line now, if one does. */
  rule: Rule | null;
  /** How the line is filed now: by its rule, or as a charge. */
  category: SpendingCategory | null;
  /** Keeps what changed: the rule (null when it did not change) and the mark. */
  onSave: (change: RuleChange | null, oneOff: boolean) => void;
  /** Drops the rule filing the line. */
  onRemoveRule: () => void;
  /** Called when the dialog closes on its own (Escape, a phone's back gesture). */
  onClose: () => void;
}

/**
 * Files one line of a statement: the merchant pattern the rule will match,
 * its category, and whether this one movement is a one-off. Saving writes
 * the rule for every statement and the mark for this line alone. Shown as a
 * full screen on a phone, a sheet on a wider screen.
 */
export default function RuleDialog({
  line,
  last4,
  cents,
  rule,
  category: filed,
  onSave,
  onRemoveRule,
  onClose,
}: RuleDialogProps) {
  const [pattern, setPattern] = useState(rule?.pattern ?? merchantKey(line.description));
  const [category, setCategory] = useState<SpendingCategory | null>(filed);
  const [oneOff, setOneOff] = useState(line.one_off);

  const text = pattern.trim();
  const change: RuleChange | null =
    !line.charge &&
    category !== null &&
    text !== '' &&
    (!rule || rule.pattern !== text || rule.category !== category)
      ? { pattern: text, category }
      : null;
  const canSave = change !== null || oneOff !== line.one_off;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    onSave(change, oneOff);
  }

  return (
    <ModalDialog
      onClose={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-surface p-0 text-on-surface backdrop:bg-on-surface/50 sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:border sm:border-border"
    >
      <form onSubmit={handleSubmit} className="flex min-h-full flex-col gap-4 p-4">
        <span className="font-medium">{line.charge ? 'Percepción' : 'Categoría'}</span>
        <ul className="border-t border-border">
          <LineRow line={line} last4={last4} cents={cents} onSelect={() => {}} />
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
                    onClick={() => setCategory(option)}
                  >
                    {CATEGORY_LABELS[option]}
                  </Chip>
                ))}
              </div>
            </FormField>
          </>
        )}

        <FormField label="Este movimiento" group>
          <button
            type="button"
            onClick={() => setOneOff((v) => !v)}
            aria-pressed={oneOff}
            className="flex w-full items-center gap-3 border-b border-border py-3 text-left"
          >
            <CheckSquare checked={oneOff} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-on-surface">Puntual</span>
              <span className="mt-0.5 text-xs text-muted">
                No cuenta en la base del mes; se compara aparte.
              </span>
            </span>
          </button>
        </FormField>

        <div className="mt-auto">
          {rule ? (
            <FormFooter
              removeLabel="Quitar regla"
              confirmQuestion="¿Quitar la regla?"
              onRemove={onRemoveRule}
              submitDisabled={!canSave}
            />
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={!canSave}>
                Guardar
              </Button>
            </div>
          )}
        </div>
      </form>
    </ModalDialog>
  );
}
