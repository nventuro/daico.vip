import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

/** The signed-in session, for whatever below the shell has to know who is in:
 *  a screen that shows one member's rows finds that member by its email. */
export const SessionContext = createContext<Session | null>(null);

/** The session the shell signed in with; null while nobody is. */
export function useSession(): Session | null {
  return useContext(SessionContext);
}
