import { lazy } from 'react';
import { IconId } from '@tabler/icons-react';
import { DOCUMENTS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useDocumentsUpcoming } from './useDocumentsUpcoming';
import { searchDocuments } from './search';

const DocumentsPage = lazy(() => import('./DocumentsPage'));
const DocumentNewPage = lazy(() => import('./DocumentNewPage'));
const DocumentPage = lazy(() => import('./DocumentPage'));

const documentos: AppModule = {
  id: 'documentos',
  name: 'Documentos',
  icon: IconId,
  specs: [DOCUMENTS_SPEC],
  // Static segments outrank dynamic ones, which is what keeps `nuevo` from
  // being read as an id.
  routes: [
    { index: true, Component: DocumentsPage },
    { path: 'nuevo', Component: DocumentNewPage },
    // The optional segment is one of the document's attachments, open in the lightbox.
    { path: ':id/:attachmentId?', Component: DocumentPage },
  ],
  useUpcoming: useDocumentsUpcoming,
  search: searchDocuments,
};

export default documentos;
