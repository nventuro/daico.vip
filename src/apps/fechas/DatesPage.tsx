import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DateEntry } from '../../lib/offline/specs';
import { draftTitleState } from '../../hooks/useDraftTitle';
import { todayIso } from '../../utils/dateUtils';
import CompletedSection from '../../components/CompletedSection';
import SectionLabel from '../../components/SectionLabel';
import AddBar from '../../components/AddBar';
import EmptyState from '../../components/EmptyState';
import ListPage from '../../components/ListPage';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { useDates } from './useDates';
import { groupByMonth, splitByToday } from './recurrence';
import DateRow from './DateRow';

export default function DatesPage() {
  const { items, loading, error } = useDates();
  const navigate = useNavigate();

  const today = todayIso();

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
        <AddBar
          // The date is written on save: the title goes on to the form, where
          // its day is picked, and nothing is written until it is saved there.
          onAdd={(title) =>
            navigate(entryPath('fechas', 'nuevo'), { state: draftTitleState(title) })
          }
          placeholder="Agregar una fecha..."
          inputLabel="Nueva fecha"
        />
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
