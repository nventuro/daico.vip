import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Trip } from '../../lib/offline/specs';
import { todayIso } from '../../utils/dateUtils';
import AddBar from '../../components/AddBar';
import CompletedSection from '../../components/CompletedSection';
import EmptyState from '../../components/EmptyState';
import LinkRow from '../../components/LinkRow';
import ListPage from '../../components/ListPage';
import SectionLabel from '../../components/SectionLabel';
import SkeletonRows from '../../components/SkeletonRows';
import { entryPath } from '../types';
import { draftTitleState } from '../../hooks/useDraftTitle';
import InboxRow from './InboxRow';
import { pendingCounts, splitTrips } from './grouping';
import { tripSubtitle } from './labels';
import { useTripInbox } from './useTripInbox';
import { useTripItems } from './useTripItems';
import { useTrips } from './useTrips';

export default function TripsPage() {
  const { items: trips, loading, error } = useTrips();
  const { items } = useTripItems();
  const { groups } = useTripInbox();
  const navigate = useNavigate();

  const today = todayIso();
  const pending = useMemo(() => pendingCounts(items), [items]);
  const { upcoming, undated, past } = useMemo(() => splitTrips(trips, today), [trips, today]);

  function renderTrip(trip: Trip) {
    return (
      <LinkRow
        key={trip.id}
        to={entryPath('viajes', trip.id)}
        title={trip.title}
        subtitle={tripSubtitle(trip, pending.get(trip.id) ?? 0, today)}
      />
    );
  }

  return (
    <ListPage
      loading={loading}
      error={error}
      skeleton={<SkeletonRows subtitle />}
      bar={
        <AddBar
          // The trip is written on save: its days are picked on the form it
          // opens, and backing out leaves nothing behind.
          onAdd={(title) =>
            navigate(entryPath('viajes', 'nuevo'), { state: draftTitleState(title) })
          }
          placeholder="Agregar un viaje..."
          inputLabel="Nuevo viaje"
          autoCapitalize="sentences"
        />
      }
    >
      {trips.length === 0 && <EmptyState>Todavía no hay viajes.</EmptyState>}
      {/* What came in by email waits above everything: it is not a trip yet,
          and it is the one thing on the screen asking to be dealt with. */}
      {groups.length > 0 && (
        <section className="mb-6">
          <SectionLabel>Inbox</SectionLabel>
          <ul>
            {groups.map((group) => (
              <InboxRow key={group.importId} group={group} today={today} />
            ))}
          </ul>
        </section>
      )}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <SectionLabel>Próximos</SectionLabel>
          <ul>{upcoming.map(renderTrip)}</ul>
        </section>
      )}
      {undated.length > 0 && (
        <section className="mb-6">
          <SectionLabel>Sin fechas</SectionLabel>
          <ul>{undated.map(renderTrip)}</ul>
        </section>
      )}
      <CompletedSection label="Pasados" count={past.length}>
        {past.map(renderTrip)}
      </CompletedSection>
    </ListPage>
  );
}
