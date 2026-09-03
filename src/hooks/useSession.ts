import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';

/** The signed-in session, for whatever below the shell has to know who is in:
 *  a table whose rows are one member's stamps them with `session.user.id`. */
export const SessionContext = createContext<Session | null>(null);

/** The session the shell signed in with; null while nobody is. */
export function useSession(): Session | null {
  return useContext(SessionContext);
}
