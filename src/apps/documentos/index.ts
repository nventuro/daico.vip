import { lazy } from 'react';
import { IconId } from '@tabler/icons-react';
import { DOCUMENTS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useDocumentsUpcoming } from './useDocumentsUpcoming';
import { searchDocuments } from './search';

const DocumentsPage = lazy(() => import('./DocumentsPage'));
const DocumentEditPage = lazy(() => import('./DocumentEditPage'));

const documentos: AppModule = {
  id: 'documentos',
  name: 'Documentos',
  icon: IconId,
  specs: [DOCUMENTS_SPEC],
  routes: [
    { index: true, Component: DocumentsPage },
    // The optional segment is one of the document's attachments, open in the lightbox.
    { path: ':id/:attachmentId?', Component: DocumentEditPage },
  ],
  useUpcoming: useDocumentsUpcoming,
  search: searchDocuments,
};

export default documentos;
