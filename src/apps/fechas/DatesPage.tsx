import { useMemo, useState } from 'react';
import { DATE_NOTICE_DAYS_DEFAULT, type DateEntry } from '../../lib/offline/specs';
import { todayIso } from '../../utils/dateUtils';
import CompletedSection from '../../components/CompletedSection';
import SectionLabel from '../../components/SectionLabel';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import { useDates } from './useDates';
import { groupByMonth, splitByToday } from './recurrence';
import DateFields, { type DateFieldsValue } from './DateFields';
import DateRow from './DateRow';

export default function DatesPage() {
  const { items, loading, error, add } = useDates();

  const today = todayIso();

  const [newFields, setNewFields] = useState<DateFieldsValue>({
    occurs_on: today,
    repeat_every: null,
    repeat_unit: null,
    notice_days: DATE_NOTICE_DAYS_DEFAULT,
  });

  function addDate(title: string) {
    // The next entry most likely repeats and warns the same way; only the day
    // is surely different.
    setNewFields((fields) => ({ ...fields, occurs_on: today }));
    void add({ title, ...newFields, comments: null });
  }

  const { upcoming, past } = useMemo(() => splitByToday(items, today), [items, today]);
  const groups = useMemo(() => groupByMonth(upcoming, today), [upcoming, today]);

  function renderEntry(entry: DateEntry) {
    return <DateRow key={entry.id} entry={entry} today={today} />;
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows subtitle />}
      bar={
        <AddBar onAdd={addDate} placeholder="Agregar una fecha..." inputLabel="Nueva fecha">
          <DateFields
            fields={newFields}
            onChange={(patch) => setNewFields((fields) => ({ ...fields, ...patch }))}
            layout="chips"
          />
        </AddBar>
      }
    >
      {upcoming.length === 0 ? (
        <EmptyState>No hay fechas. Agregá cumpleaños, turnos, lo que quieras.</EmptyState>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="mb-6">
            <SectionLabel>{group.label}</SectionLabel>
            <ul>{group.entries.map(renderEntry)}</ul>
          </section>
        ))
      )}
      <CompletedSection label="Pasadas" count={past.length}>
        <ul>{past.map(renderEntry)}</ul>
      </CompletedSection>
    </ListPage>
  );
}
