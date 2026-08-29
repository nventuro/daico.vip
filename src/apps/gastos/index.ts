import { lazy } from 'react';
import { IconCreditCard } from '@tabler/icons-react';
import { MERCHANT_RULES_SPEC, STATEMENTS_SPEC } from '../../lib/offline/specs';
import type { AppModule } from '../types';
import { STATEMENTS_SEGMENT } from './paths';
import { useStatementsUpcoming } from './useStatementsUpcoming';

const MonthsPage = lazy(() => import('./MonthsPage'));
const MonthPage = lazy(() => import('./MonthPage'));
const StatementsPage = lazy(() => import('./StatementsPage'));
const StatementPage = lazy(() => import('./StatementPage'));
const RulesPage = lazy(() => import('./RulesPage'));

const gastos: AppModule = {
  id: 'gastos',
  name: 'Gastos',
  icon: IconCreditCard,
  specs: [STATEMENTS_SPEC, MERCHANT_RULES_SPEC],
  // The months are the app; the statements are a screen under them, with a
  // statement under that. A month is a yyyy-mm, so it never looks like the
  // static segments beside it.
  routes: [
    { index: true, Component: MonthsPage },
    { path: STATEMENTS_SEGMENT, Component: StatementsPage },
    { path: `${STATEMENTS_SEGMENT}/:id`, Component: StatementPage },
    { path: 'categorizacion', Component: RulesPage },
    { path: ':month', Component: MonthPage },
  ],
  useUpcoming: useStatementsUpcoming,
  // No `search`: a statement's merchants and amounts are sealed in its payload,
  // and search reads the local tables as they are stored. Looking through them
  // would mean unsealing every statement on every keystroke.
};

export default gastos;
