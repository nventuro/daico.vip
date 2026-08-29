import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconTags, IconTrendingUp } from '@tabler/icons-react';
import type { Statement } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { dueWord, isPast, relativeDay, todayIso } from '../../utils/dateUtils';
import { tooLargeMessage } from '../../utils/textUtils';
import DialogFooter from '../../components/DialogFooter';
import EmptyState from '../../components/EmptyState';
import ErrorLine from '../../components/ErrorLine';
import HiddenFileInput from '../../components/HiddenFileInput';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import LoadingLine from '../../components/LoadingLine';
import ModalDialog from '../../components/ModalDialog';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import {
  ADD_BAR_BUTTON_CLASS,
  ADD_BAR_CLASS,
  ADD_BAR_INPUT_CLASS,
} from '../../components/controlClasses';
import { appPath, entryPath } from '../types';
import { useStatements } from './useStatements';
import { openStatement, useStatementsContents } from './useStatementContents';
import { parseStatement } from './parsers';
import { StatementError, withOneOffsFrom, type StatementContents } from './statement';
import { toPayCents } from './breakdown';
import { FORMAT_LABELS, formatArs, periodLabel, statementTitle } from './labels';

/** Largest PDF taken as a statement, in bytes (input guard). */
const STATEMENT_PDF_MAX_BYTES = 5 * 1024 * 1024;

/** A statement just read that is already here: the user decides whether it
 *  takes the place of the one imported before. */
interface Duplicate {
  contents: StatementContents;
  existing: Statement;
}

export default function StatementsPage() {
  const { items, loading, error, add, replace } = useStatements();
  // Each statement is one figure in pesos, its dollars at its own rate — which
  // is in the sealed payload, so every statement listed is opened.
  const { contents, error: openError } = useStatementsContents(items);
  const masterKey = useMasterKey();
  const navigate = useNavigate();
  const [reading, setReading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<Duplicate | null>(null);
  const today = todayIso();

  async function keep(contents: StatementContents, existing?: Statement) {
    if (masterKey.status !== 'unlocked') return;
    if (existing) {
      const previous = await openStatement(existing, masterKey.key);
      await replace(existing.id, withOneOffsFrom(contents, previous), masterKey.key);
      navigate(entryPath('gastos', existing.id));
      return;
    }
    const id = await add(contents, masterKey.key);
    if (id) navigate(entryPath('gastos', id));
  }

  async function importFile(file: File) {
    setProblem(null);
    if (file.size > STATEMENT_PDF_MAX_BYTES) {
      setProblem(tooLargeMessage(file.size, STATEMENT_PDF_MAX_BYTES));
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

  const busy = reading || masterKey.status !== 'unlocked';

  return (
    <>
      <ListPage
        loading={loading || (!openError && contents?.length !== items.length)}
        error={error ?? openError}
        skeleton={<SkeletonRows subtitle />}
        bar={
          /* The add bar every list ends in, with the file picker where the text
           would go: a statement is added by picking its PDF, not by typing. */
          <div className={ADD_BAR_CLASS}>
            <ErrorLine problem={problem} className="mb-3" />
            {reading && (
              <div className="mb-3">
                <LoadingLine />
              </div>
            )}
            <HiddenFileInput
              accept="application/pdf"
              label="Resumen en PDF"
              onPick={(files) => void importFile(files[0])}
            >
              {(pick) => (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={pick}
                    disabled={busy}
                    className={`${ADD_BAR_INPUT_CLASS} text-left text-muted disabled:text-disabled`}
                  >
                    Agregar un resumen...
                  </button>
                  <button
                    type="button"
                    onClick={pick}
                    disabled={busy}
                    aria-label="Agregar resumen"
                    title="Agregar resumen"
                    className={ADD_BAR_BUTTON_CLASS}
                  >
                    <IconPlus size={22} stroke={2} />
                  </button>
                </div>
              )}
            </HiddenFileInput>
          </div>
        }
      >
        {items.length === 0 ? (
          <EmptyState>Todavía no hay resúmenes. Importá el PDF que manda el banco.</EmptyState>
        ) : (
          <>
            <ul>
              <LinkRow
                to={`${appPath('gastos')}/tendencias`}
                title="Tendencias"
                leading={
                  <IconTrendingUp size={20} stroke={1.75} className="shrink-0 text-(--app)" />
                }
                chevron
              />
              <LinkRow
                to={`${appPath('gastos')}/categorizacion`}
                title="Categorización"
                leading={<IconTags size={20} stroke={1.75} className="shrink-0 text-(--app)" />}
                chevron
              />
            </ul>
            <div className="mt-5">
              <SectionLabel>Resúmenes</SectionLabel>
              <ul>
                {items.map((statement, i) => {
                  const overdue = !statement.paid && isPast(statement.due_on, today);
                  const usdRate = contents?.[i]?.usd_rate ?? null;
                  const due = `${dueWord(statement.due_on, today)} ${relativeDay(today, statement.due_on)}`;
                  return (
                    <LinkRow
                      key={statement.id}
                      to={entryPath('gastos', statement.id)}
                      title={statementTitle(statement)}
                      subtitle={`${statement.paid ? '' : `${due} · `}${formatArs(
                        toPayCents({ ...statement, usd_rate: usdRate }),
                      )}`}
                      overdue={overdue}
                      chevron
                    />
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </ListPage>
      {duplicate && (
        <ModalDialog onClose={() => setDuplicate(null)} layout="confirm">
          <div className="flex flex-col gap-2">
            <p className="font-medium text-on-surface">
              Ya está el resumen {FORMAT_LABELS[duplicate.contents.format]}{' '}
              {periodLabel(duplicate.contents)}. ¿Reemplazarlo?
            </p>
            <p className="text-sm text-muted">Lo que marcaste como puntual se conserva.</p>
            <DialogFooter
              onCancel={() => setDuplicate(null)}
              confirmLabel="Reemplazar"
              onConfirm={() => {
                const { contents, existing } = duplicate;
                setDuplicate(null);
                void keep(contents, existing);
              }}
            />
          </div>
        </ModalDialog>
      )}
    </>
  );
}
