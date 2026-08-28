import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config';

// PKCE, so the redirect brings back a code and not the tokens themselves: with
// the implicit flow they arrive in the URL fragment, where the browser's
// history keeps them and anything running on the page can read them.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { flowType: 'pkce' },
});
