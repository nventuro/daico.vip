import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavigationType, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { IconSearch, IconSettings } from '@tabler/icons-react';
import IconButton from '../components/IconButton';
import UndoNotice from '../components/UndoNotice';
import { recordVisit } from '../lib/visited';
import { syncAll } from '../lib/offline/sync';
import { useAppContext } from './appContext';
import { useDbOwnership } from '../hooks/useDbOwnership';
import { useMasterKey } from '../hooks/useMasterKey';
import { useSyncStatus } from '../hooks/useSyncStatus';
import LoginScreen from './LoginScreen';
import NoAccessScreen from './NoAccessScreen';
import UnlockScreen from './UnlockScreen';
import FirstSyncScreen from './FirstSyncScreen';
import InboxKeySetup from './InboxKeySetup';
import BackupMark from './BackupMark';

// Rarely shown (only a second tab hits it), so it's kept out of the main bundle.
const TabConflictScreen = lazy(() => import('./TabConflictScreen'));

export default function MainLayout() {
  const { session, isMember } = useAppContext();
  const dbOwnership = useDbOwnership();
  const masterKey = useMasterKey();
  const syncing = useSyncStatus((status) => status.syncing);
  const completedAt = useSyncStatus((status) => status.completedAt);
  const [enteredEarly, setEnteredEarly] = useState(false);
  const enter = useCallback(() => setEnteredEarly(true), []);
  // Whether the run this page load asks for is still going. A device with no
  // connection asks for none, so it has nothing to wait for.
  const [opening, setOpening] = useState(() => navigator.onLine);
  const asked = useRef(false);
  // The member is all the way in: the store is this tab's and the key is here,
  // so there is somewhere to sync into and the screens can be read.
  const inside =
    Boolean(session) && isMember && dbOwnership === 'owner' && masterKey.status === 'unlocked';
  // The one run the app asks for on its own account, told apart from every
  // other by being this one's to wait on: what a table's screen or a write
  // asks for later is nobody's to hold the app for.
  useEffect(() => {
    if (!inside) {
      asked.current = false;
      return;
    }
    if (asked.current) return;
    asked.current = true;
    // A device with no connection asks for a run that is over before it began,
    // so it waits for nothing.
    void syncAll().finally(() => setOpening(false));
  }, [inside]);
  // Every screen's way out reads this record, so every screen is told to it —
  // whichever gate below the layout stops at.
  const { key, pathname } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => recordVisit(key, pathname, navigationType), [key, pathname, navigationType]);
  // A screen opens at its top: what is arrived at is a new screen, however far
  // down the last one was; what is gone back to, the browser puts back where
  // it was.
  useLayoutEffect(() => {
    if (navigationType !== NavigationType.Pop) window.scrollTo(0, 0);
  }, [key, navigationType]);

  if (!session) return <LoginScreen />;
  if (!isMember) return <NoAccessScreen />;
  // The local store allows one connection per browser; a second tab is diverted.
  if (dbOwnership === 'blocked')
    return (
      <Suspense fallback={null}>
        <TabConflictScreen />
      </Suspense>
    );
  // A device without the household's master key stops here until the phrase
  // is typed: the documents it would show are unreadable without it.
  if (masterKey.status === 'loading') return null;
  if (masterKey.status === 'locked') return <UnlockScreen />;
  // What is on its way is shown while it comes: on a device that has never
  // brought everything down until it has, and on every other open while the
  // run this page load asked for goes — unless the member would rather go in
  // meanwhile.
  if ((opening || completedAt === null) && !enteredEarly)
    return <FirstSyncScreen onEnter={enter} />;

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-on-surface">
      <InboxKeySetup />
      <header className="sticky top-0 z-30 h-(--header-height) border-b-2 border-on-surface bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-2xl items-center justify-between px-4">
          <span className="flex items-center gap-2.5">
            <Link to="/" title="Inicio" className="font-display text-2xl font-black tracking-tight">
              daico
            </Link>
            {syncing && (
              <span
                role="status"
                aria-label="Sincronizando"
                title="Sincronizando"
                className="size-2.5 animate-turn bg-on-surface"
              />
            )}
          </span>
          <div className="flex items-center gap-1">
            <IconButton
              label="Buscar"
              icon={IconSearch}
              to="/buscar"
              tone="band"
              className="px-2 py-1"
            />
            <span className="relative flex">
              <IconButton
                label="Ajustes"
                icon={IconSettings}
                to="/ajustes"
                tone="band"
                className="px-2 py-1"
              />
              <BackupMark />
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-6">
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
        {/* A screen with no bar of its own still shows the app's undo, in the
            place a bar would have. */}
        <UndoNotice pinned />
      </main>
    </div>
  );
}
