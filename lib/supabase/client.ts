'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Browser-side Supabase client.
 * Call once per component tree — safe to call in every 'use client' file
 * because createBrowserClient returns a shared singleton internally.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
