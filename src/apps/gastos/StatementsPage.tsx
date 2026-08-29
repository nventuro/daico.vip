import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconAlertTriangle, IconPlus } from '@tabler/icons-react';
import type { Statement, StatementFormat } from '../../lib/offline/specs';
import { useMasterKey } from '../../hooks/useMasterKey';
import { dueWord, formatDateCompact, isPast, relativeDay, todayIso } from '../../utils/dateUtils';
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
import { useStatements } from './useStatements';
import { openStatement, useStatementsContents } from './useStatementContents';
import { parseStatement } from './parsers';
import { StatementError, withOneOffsFrom, type StatementContents } from './statement';
import { toPayCents } from './breakdown';
import { coverageByCard, type Period } from './coverage';
import { statementPath } from './paths';
import { FORMAT_LABELS, formatArs, lateLabel, periodLabel, statementTitle } from './labels';
import CardMark from './CardMark';

/** Largest PDF taken as a statement, in bytes (input guard). */
const STATEMENT_PDF_MAX_BYTES = 5 * 1024 * 1024;

/** What a row takes at its end when the statement it is about never came in. */
const MISSING_MARK = (
  <span
    role="img"
    aria-label="Falta un resumen"
    title="Falta un resumen"
    className="flex shrink-0 text-warning"
  >
    <IconAlertTriangle size={18} stroke={1.75} />
  </span>
);

/** A statement just read that is already here: the user decides whether it
 *  takes the place of the one imported before. */
interface Duplicate {
  contents: StatementContents;
  existing: Statement;
}

/** What the list is made of: the statements there are, and — where the
 *  periods of a card do not meet — the one that never came in, in its place. */
type Listed =
  | { kind: 'statement'; on: string; statement: Statement; contents: StatementContents }
  | { kind: 'gap'; on: string; format: StatementFormat; period: Period };

/**
 * Every statement by the days it covers, and the ones missing where they
 * would have been — the card each is for said by its mark, so a row is a
 * period and an amount and nothing else. This is also where one is added.
 */
export default function StatementsPage() {
  const { items, loading, error, add, replace } = useStatements();
  // Each statement is named by the days it covers and worth one figure in
  // pesos, its dollars at its own rate — both of them sealed in the payload,
  // so every statement listed is opened.
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
      navigate(statementPath(existing.id));
      return;
    }
    const id = await add(contents, masterKey.key);
    if (id) navigate(statementPath(id));
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
  // A statement and its contents are only ever read together: a row is named
  // by the days it covers, which is in the payload. Until every one is open
  // there is no list to build — and the list is built whether or not it is the
  // one on screen, so a row without its contents is not something holding the
  // list's place can save.
  const opened = contents?.length === items.length ? contents : undefined;
  const cards = opened ? coverageByCard(opened, today) : [];
  // A card whose gaps are missing statements says so where they belong, in
  // the list; one that has gone quiet has nowhere in the list to say it.
  const late = cards.filter((card) => card.late);
  const listed: Listed[] = opened
    ? [
        ...items.map((statement, i) => ({
          kind: 'statement' as const,
          on: statement.closed_on,
          statement,
          contents: opened[i],
        })),
        ...cards.flatMap((card) =>
          card.gaps.map((period) => ({
            kind: 'gap' as const,
            on: period.to,
            format: card.format,
            period,
          })),
        ),
      ].sort((a, b) => b.on.localeCompare(a.on))
    : [];

  return (
    <>
      <ListPage
        loading={loading || (!openError && !opened)}
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
            {late.length > 0 && (
              <ul className="mb-5">
                {late.map((card) => (
                  <LinkRow
                    key={card.format}
                    title="No llega un resumen nuevo"
                    subtitle={lateLabel(card)}
                    leading={<CardMark format={card.format} />}
                    trailing={MISSING_MARK}
                  />
                ))}
              </ul>
            )}

            <section>
              <SectionLabel>Resúmenes</SectionLabel>
              <ul>
                {listed.map((row) => {
                  if (row.kind === 'gap') {
                    return (
                      <LinkRow
                        key={`gap-${row.format}-${row.on}`}
                        title="Falta un resumen"
                        subtitle={`del ${formatDateCompact(row.period.from)} al ${formatDateCompact(row.period.to)}`}
                        leading={<CardMark format={row.format} />}
                        trailing={MISSING_MARK}
                      />
                    );
                  }
                  const { statement } = row;
                  const overdue = !statement.paid && isPast(statement.due_on, today);
                  return (
                    <LinkRow
                      key={statement.id}
                      to={statementPath(statement.id)}
                      title={statementTitle(row.contents)}
                      // A statement that is paid has nothing left to say about
                      // when it was due: the row is the days and the amount.
                      subtitle={
                        statement.paid
                          ? undefined
                          : `${dueWord(statement.due_on, today)} ${relativeDay(today, statement.due_on)}`
                      }
                      overdue={overdue}
                      leading={<CardMark format={statement.format} />}
                      trailing={
                        <span className="shrink-0 tabular-nums">
                          {formatArs(toPayCents(row.contents))}
                        </span>
                      }
                      chevron
                    />
                  );
                })}
              </ul>
            </section>
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
