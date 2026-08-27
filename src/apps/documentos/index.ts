import { lazy } from 'react';
import { IconId } from '@tabler/icons-react';
import { DOCUMENTS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useDocumentsUpcoming } from './useDocumentsUpcoming';
import { searchDocuments } from './search';

const DocumentsPage = lazy(() => import('./DocumentsPage'));
const DocumentEditPage = lazy(() => import('./DocumentEditPage'));
const NewDocumentAttachmentPage = lazy(() => import('./NewDocumentAttachmentPage'));
const DocumentAttachmentPage = lazy(() => import('./DocumentAttachmentPage'));

const documentos: AppModule = {
  id: 'documentos',
  name: 'Documentos',
  hue: 'app-documentos',
  icon: IconId,
  specs: [DOCUMENTS_SPEC],
  routes: [
    { index: true, Component: DocumentsPage },
    { path: ':id', Component: DocumentEditPage },
    { path: ':id/nuevo/:attachmentId', Component: NewDocumentAttachmentPage },
    { path: ':id/:attachmentId', Component: DocumentAttachmentPage },
  ],
  useUpcoming: useDocumentsUpcoming,
  search: searchDocuments,
};

export default documentos;
