// Supabase project credentials. Replace these with your project's values from
// Project Settings → API Keys in the Supabase dashboard.
//
// The key is the project's publishable one (`sb_publishable_...`), which is
// safe to commit and ship in the browser: it only grants whatever Row Level
// Security policies allow, and all data is gated behind `is_member()`, so a
// leaked publishable key still cannot read anything.
export const SUPABASE_URL = 'https://qspcogwwvpifopuwrhne.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_p9bzX2DL7L_nG2CuBsF4wQ_mV_04lVV';

/** Privacy-enhanced YouTube embed base; append the video id. */
export const YOUTUBE_EMBED_URL = 'https://www.youtube-nocookie.com/embed/';

/** YouTube watch page base; append the video id. */
export const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v=';

/** A YouTube video id, as the `::youtube` directive must carry it. */
export const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;
