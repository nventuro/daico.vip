import { lazy } from 'react';
import { IconNotes } from '@tabler/icons-react';
import { NOTES_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { searchNotes } from './search';

const NotesPage = lazy(() => import('./NotesPage'));
const NotePage = lazy(() => import('./NotePage'));
const NoteEditPage = lazy(() => import('./NoteEditPage'));

// No `useUpcoming`: a note has no date, so there is nothing of it that is
// coming up.
const notas: AppModule = {
  id: 'notas',
  name: 'Notas',
  icon: IconNotes,
  specs: [NOTES_SPEC],
  routes: [
    { index: true, Component: NotesPage },
    { path: ':id/editar', Component: NoteEditPage },
    // The optional segment is one of the note's attachments, open in the lightbox.
    { path: ':id/:attachmentId?', Component: NotePage },
  ],
  search: searchNotes,
};

export default notas;
