import { lazy } from 'react';
import { IconCreditCard } from '@tabler/icons-react';
import { MERCHANT_RULES_SPEC, STATEMENTS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { useStatementsUpcoming } from './useStatementsUpcoming';

const StatementsPage = lazy(() => import('./StatementsPage'));
const StatementPage = lazy(() => import('./StatementPage'));
const TrendsPage = lazy(() => import('./TrendsPage'));
const RulesPage = lazy(() => import('./RulesPage'));

const gastos: AppModule = {
  id: 'gastos',
  name: 'Gastos',
  icon: IconCreditCard,
  specs: [STATEMENTS_SPEC, MERCHANT_RULES_SPEC],
  routes: [
    { index: true, Component: StatementsPage },
    { path: 'tendencias', Component: TrendsPage },
    { path: 'categorizacion', Component: RulesPage },
    { path: ':id', Component: StatementPage },
  ],
  useUpcoming: useStatementsUpcoming,
  // No `search`: a statement's merchants and amounts are sealed in its payload,
  // and search reads the local tables as they are stored. Looking through them
  // would mean unsealing every statement on every keystroke.
};

export default gastos;
