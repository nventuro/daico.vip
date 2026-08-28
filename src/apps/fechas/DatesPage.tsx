import { useMemo, useState } from 'react';
import { DATE_NOTICE_DAYS_DEFAULT, type DateEntry } from '../../types';
import { todayIso } from '../../utils/dateUtils';
import OfflineBanner from '../../components/OfflineBanner';
import CompletedSection from '../../components/CompletedSection';
import SectionLabel from '../../components/SectionLabel';
import AddBar from '../../components/AddBar';
import { useDates } from './useDates';
import { groupByMonth, splitByToday } from './recurrence';
import DateFields, { type DateFieldsValue } from './DateFields';
import DateRow from './DateRow';
import SkeletonRows from '../../components/SkeletonRows';

export default function DatesPage() {
  const { items, loading, error, add, remove } = useDates();

  const today = todayIso();

  const [newTitle, setNewTitle] = useState('');
  const [newFields, setNewFields] = useState<DateFieldsValue>({
    occurs_on: today,
    repeat: 'none',
    repeat_months: null,
    notice_days: DATE_NOTICE_DAYS_DEFAULT,
  });

  function addDate() {
    const title = newTitle.trim();
    if (!title || !newFields.occurs_on) return;
    setNewTitle('');
    // The next entry most likely repeats and warns the same way; only the day
    // is surely different.
    setNewFields((fields) => ({ ...fields, occurs_on: today }));
    void add({ title, ...newFields, notes: null });
  }

  const { upcoming, past } = useMemo(() => splitByToday(items, today), [items, today]);
  const groups = useMemo(() => groupByMonth(upcoming, today), [upcoming, today]);

  function renderEntry(entry: DateEntry) {
    return (
      <DateRow key={entry.id} entry={entry} today={today} onRemove={() => void remove(entry)} />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        <OfflineBanner />

        {error && <p className="mb-4 text-sm text-error">Error: {error}</p>}

        {loading ? (
          <SkeletonRows subtitle />
        ) : (
          <>
            {upcoming.length === 0 ? (
              <p className="py-10 text-center text-muted">
                No hay fechas. Agregá cumpleaños, turnos, lo que quieras.
              </p>
            ) : (
              groups.map((group) => (
                <section key={group.key} className="mb-6">
                  <SectionLabel>{group.label}</SectionLabel>
                  <ul>{group.entries.map(renderEntry)}</ul>
                </section>
              ))
            )}
            <CompletedSection label="Pasadas" count={past.length}>
              {past.map(renderEntry)}
            </CompletedSection>
          </>
        )}
      </div>

      <AddBar
        value={newTitle}
        onChange={setNewTitle}
        onSubmit={addDate}
        placeholder="Agregar una fecha..."
        inputLabel="Nueva fecha"
      >
        <DateFields
          occursOn={newFields.occurs_on}
          repeat={newFields.repeat}
          repeatMonths={newFields.repeat_months}
          noticeDays={newFields.notice_days}
          onChange={(patch) => setNewFields((fields) => ({ ...fields, ...patch }))}
          layout="chips"
        />
      </AddBar>
    </div>
  );
}
