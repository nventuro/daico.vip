import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

export interface AppContextValue {
  session: Session | null;
  /** True only when the signed-in account's email is in the members allowlist. */
  isMember: boolean;
  signIn: () => void;
  signOut: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
