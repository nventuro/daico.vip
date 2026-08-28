import { type FormEvent, useMemo, useState } from 'react';
import { SPENDING_CATEGORIES } from '../../types';
import ModalDialog from '../../components/ModalDialog';
import FormField from '../../components/FormField';
import TextArea from '../../components/TextArea';
import Button from '../../components/Button';
import { CATEGORY_LABELS } from './labels';
import { parseRulesText, type ParsedRules } from './rules';

/** How many lines that are not a rule are pointed at before the rest is summed up. */
const PROBLEMS_SHOWN = 5;

interface RulesImportDialogProps {
  /** Keeps the rules pasted; resolves once they are written. */
  onSave: (rules: ParsedRules['rules']) => Promise<unknown>;
  /** Called when the dialog closes on its own (Escape, a phone's back gesture). */
  onClose: () => void;
}

/**
 * Takes rules pasted in bulk, one per line with the category last, and
 * writes them all at once — none while a line is not a rule. Shown as a
 * full screen on a phone, a sheet on a wider screen.
 */
export default function RulesImportDialog({ onSave, onClose }: RulesImportDialogProps) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const parsed = useMemo(() => parseRulesText(text), [text]);
  const canSave = parsed.rules.length > 0 && parsed.problems.length === 0 && !saving;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(parsed.rules);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalDialog
      onClose={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-surface p-0 text-on-surface backdrop:bg-on-surface/50 sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:w-full sm:max-w-lg sm:border sm:border-border"
    >
      <form onSubmit={handleSubmit} className="flex min-h-full flex-col gap-4 p-4">
        <span className="font-medium">Pegar reglas</span>

        <FormField label="Reglas">
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Reglas"
            rows={12}
            autoFocus
            spellCheck={false}
            placeholder={'MERPAGO KIOSCOS supermercado\nCAFE ORBITA salidas'}
            className="font-mono text-sm"
          />
          <span className="text-xs text-muted">
            Una por línea: el texto del comercio y, al final, la categoría (
            {SPENDING_CATEGORIES.map((c) => CATEGORY_LABELS[c]).join(', ')}). Un comercio que ya
            tiene regla cambia de categoría; ninguna se borra.
          </span>
        </FormField>

        {parsed.problems.length > 0 && (
          <ul className="text-sm text-error">
            {parsed.problems.slice(0, PROBLEMS_SHOWN).map((problem) => (
              <li key={problem.line}>
                Línea {problem.line}: «{problem.text}» no termina en una categoría.
              </li>
            ))}
            {parsed.problems.length > PROBLEMS_SHOWN && (
              <li>y {parsed.problems.length - PROBLEMS_SHOWN} líneas más.</li>
            )}
          </ul>
        )}

        <div className="mt-auto flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={!canSave}>
            {parsed.rules.length > 0 ? `Guardar ${parsed.rules.length} reglas` : 'Guardar'}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
