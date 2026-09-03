import { useState, type FormEvent } from 'react';
import { attachmentProblem } from '../lib/attachmentFiles';
import { usePdf } from '../hooks/usePdf';
import { countLabel, formatBytes } from '../utils/textUtils';
import Button from './Button';
import ErrorLine from './ErrorLine';
import FormField from './FormField';
import LoadingLine from './LoadingLine';
import PdfPage from './PdfPage';
import TextInput from './TextInput';

interface PdfPreviewProps {
  file: File;
  skipLabel: string;
  submitLabel: string;
  /** Stores the PDF; false when it could not be. */
  onSave: (file: File, name: string) => Promise<boolean>;
  onSkip: () => void;
}

/**
 * One picked PDF on its way to becoming an attachment: its first page, to
 * see it is the right one, how many pages it has, and an optional name. It
 * is stored as it came — there is nothing of a PDF to crop or turn — and
 * never before it could be opened, since a PDF that cannot be drawn here
 * could not be shown either.
 */
export default function PdfPreview({
  file,
  skipLabel,
  submitLabel,
  onSave,
  onSkip,
}: PdfPreviewProps) {
  const refused = attachmentProblem(file);
  const view = usePdf(refused ? null : file);
  const [name, setName] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    // The entry's own form is an ancestor in the React tree, if not in the
    // document, and must not take this submit for its own.
    e.stopPropagation();
    if (view.status !== 'ready' || busy) return;
    setBusy(true);
    try {
      if (!(await onSave(file, name))) setProblem('No se pudo guardar el PDF.');
    } catch {
      setProblem('No se pudo guardar el PDF.');
    } finally {
      setBusy(false);
    }
  }

  const unreadable = refused ?? (view.status === 'failed' ? 'No se pudo leer el PDF.' : null);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex h-[50dvh] items-center justify-center overflow-hidden bg-surface-inverse p-3">
        {view.status === 'ready' ? (
          <PdfPage pdf={view.pdf} number={1} alt="Primera página" className="h-full" inverse />
        ) : unreadable ? (
          <span className="px-4 text-center text-sm text-error">{unreadable}</span>
        ) : (
          <LoadingLine inverse className="w-1/3" />
        )}
      </div>

      {view.status === 'ready' && (
        <span className="text-xs text-muted">
          {countLabel(view.pdf.numPages, 'página', 'páginas')} · {formatBytes(file.size)}
        </span>
      )}

      <FormField label="Nombre">
        <TextInput
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="opcional"
          aria-label="Nombre"
          autoCapitalize="none"
        />
      </FormField>

      <ErrorLine problem={problem} />

      <div className="mt-2 flex items-center justify-between gap-3">
        <Button variant="outline" onClick={onSkip} disabled={busy}>
          {skipLabel}
        </Button>
        <Button type="submit" disabled={view.status !== 'ready' || busy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
