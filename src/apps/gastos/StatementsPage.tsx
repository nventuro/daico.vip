import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconChevronRight, IconFileUpload, IconTags, IconTrendingUp } from '@tabler/icons-react';
import { STATEMENT_PDF_MAX_BYTES, type Statement } from '../../types';
import { useMasterKey } from '../../hooks/useMasterKey';
import { formatDateShort, relativeDay, todayIso } from '../../utils/dateUtils';
import { formatBytes } from '../../utils/textUtils';
import OfflineBanner from '../../components/OfflineBanner';
import SkeletonRows from '../../components/SkeletonRows';
import SectionLabel from '../../components/SectionLabel';
import Button from '../../components/Button';
import ModalDialog from '../../components/ModalDialog';
import LoadingLine from '../../components/LoadingLine';
import { useStatements } from './useStatements';
import { openStatement } from './useStatementContents';
import { parseStatement } from './parsers';
import { StatementError, withOneOffsFrom, type StatementContents } from './statement';
import { monthOf } from './breakdown';
import { FORMAT_LABELS, formatArs, formatUsd, monthTitle } from './labels';

/** A statement just read that is already here: the user decides whether it
 *  takes the place of the one imported before. */
interface Duplicate {
  contents: StatementContents;
  existing: Statement;
}

export default function StatementsPage() {
  const { items, loading, error, add, replace } = useStatements();
  const masterKey = useMasterKey();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null);
  const today = todayIso();

  async function keep(contents: StatementContents, existing?: Statement) {
    if (masterKey.status !== 'unlocked') return;
    if (existing) {
      const previous = await openStatement(existing, masterKey.key);
      await replace(existing.id, withOneOffsFrom(contents, previous), masterKey.key);
      navigate(`/gastos/${existing.id}`);
      return;
    }
    const id = await add(contents, masterKey.key);
    if (id) navigate(`/gastos/${id}`);
  }

  async function importFile(file: File) {
    setProblem(null);
    if (file.size > STATEMENT_PDF_MAX_BYTES) {
      setProblem(
        `El archivo pesa ${formatBytes(file.size)}; el máximo es ${formatBytes(STATEMENT_PDF_MAX_BYTES)}.`,
      );
      return;
    }
    setReading(true);
    try {
      // pdf.js and its worker weigh as much as the rest of the app: fetched
      // the first time a statement is imported, never before.
      const { readPdfPages } = await import('./pdfWords');
      const contents = parseStatement(await readPdfPages(file));
      const existing = items.find(
        (s) => s.format === contents.format && s.closed_on === contents.closed_on,
      );
      if (existing) setDuplicate({ contents, existing });
      else await keep(contents);
    } catch (e) {
      setProblem(e instanceof StatementError ? e.message : 'No se pudo leer el PDF.');
    } finally {
      setReading(false);
    }
  }

  function pick() {
    const input = inputRef.current;
    if (!input) return;
    input.value = '';
    input.click();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <SkeletonRows subtitle />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-muted">
            Todavía no hay resúmenes. Importá el PDF que manda el banco.
          </p>
        ) : (
          <>
            <Link
              to="/gastos/tendencias"
              className="flex items-center gap-3 border-b border-border py-3 transition-colors hover:bg-border-subtle"
            >
              <IconTrendingUp size={20} stroke={1.75} className="shrink-0 text-(--app)" />
              <span className="flex-1 font-medium">Tendencias</span>
              <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />
            </Link>
            <Link
              to="/gastos/reglas"
              className="flex items-center gap-3 border-b border-border py-3 transition-colors hover:bg-border-subtle"
            >
              <IconTags size={20} stroke={1.75} className="shrink-0 text-(--app)" />
              <span className="flex-1 font-medium">Reglas</span>
              <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />
            </Link>
            <div className="mt-5">
              <SectionLabel>Resúmenes</SectionLabel>
              <ul>
                {items.map((statement) => (
                  <li key={statement.id} className="border-b border-border">
                    <Link
                      to={`/gastos/${statement.id}`}
                      className="flex items-center gap-2 py-2.5 transition-colors hover:bg-border-subtle"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-on-surface">
                          {monthTitle(monthOf(statement))}
                          <span className="text-muted"> · {FORMAT_LABELS[statement.format]}</span>
                        </span>
                        <span className="mt-0.5 truncate text-xs text-muted">
                          {statement.due_on >= today &&
                            `vence ${relativeDay(today, statement.due_on)} · `}
                          {formatArs(statement.total_ars_cents)}
                          {statement.total_usd_cents !== 0 &&
                            ` + ${formatUsd(statement.total_usd_cents)}`}
                        </span>
                      </span>
                      <IconChevronRight size={18} stroke={1.5} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur">
        {problem && <p className="text-sm text-error">{problem}</p>}
        {reading && <LoadingLine />}
        <Button
          onClick={pick}
          disabled={reading || masterKey.status !== 'unlocked'}
          className="flex w-full items-center justify-center gap-2 py-3"
        >
          <IconFileUpload size={20} stroke={1.75} />
          Importar resumen (PDF)
        </Button>
        {/* The button is the visible control; this input only carries the file picker. */}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importFile(file);
          }}
          aria-label="Resumen en PDF"
          tabIndex={-1}
          className="sr-only"
        />
      </div>

      {duplicate && (
        <ModalDialog
          onClose={() => setDuplicate(null)}
          className="m-auto w-[calc(100%-2rem)] max-w-sm border border-border bg-surface p-4 text-on-surface backdrop:bg-on-surface/50"
        >
          <div className="flex flex-col gap-2">
            <p className="font-medium text-on-surface">
              Ya está el resumen {FORMAT_LABELS[duplicate.contents.format]} con cierre{' '}
              {formatDateShort(duplicate.contents.closed_on)}. ¿Reemplazarlo?
            </p>
            <p className="text-sm text-muted">Lo que marcaste como puntual se conserva.</p>
            <div className="mt-1 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDuplicate(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  const { contents, existing } = duplicate;
                  setDuplicate(null);
                  void keep(contents, existing);
                }}
              >
                Reemplazar
              </Button>
            </div>
          </div>
        </ModalDialog>
      )}
    </div>
  );
}
