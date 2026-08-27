import { lazy } from 'react';
import { IconListCheck } from '@tabler/icons-react';
import { ATTACHMENTS_SPEC, CHORES_SPEC } from '../../lib/offline/specs';
import { afterSync } from '../../lib/offline/sync';
import { syncAttachmentFiles } from '../../lib/attachmentFiles';
import type { AppModule } from '../types';
import { useChoresUpcoming } from './useChoresUpcoming';
import { searchChores } from './search';

const ChoresPage = lazy(() => import('./ChoresPage'));
const ChoreEditPage = lazy(() => import('./ChoreEditPage'));
const NewAttachmentPage = lazy(() => import('./NewAttachmentPage'));
const AttachmentPage = lazy(() => import('./AttachmentPage'));

// Attachment files travel outside the tables; they follow every sync so a file
// added offline goes up as soon as the rows do, whichever screen is open.
afterSync(syncAttachmentFiles);

const tareas: AppModule = {
  id: 'tareas',
  name: 'Tareas',
  hue: 'app-tareas',
  icon: IconListCheck,
  specs: [CHORES_SPEC, ATTACHMENTS_SPEC],
  routes: [
    { index: true, Component: ChoresPage },
    { path: ':id', Component: ChoreEditPage },
    { path: ':id/nuevo', Component: NewAttachmentPage },
    { path: ':id/:attachmentId', Component: AttachmentPage },
  ],
  useUpcoming: useChoresUpcoming,
  search: searchChores,
};

export default tareas;
