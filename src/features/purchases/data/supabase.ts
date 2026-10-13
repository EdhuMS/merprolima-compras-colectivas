import { createClient } from '@supabase/supabase-js';
// Preparado para conexión futura. La demo nunca envía registros simulados a Supabase.
export function createSupabaseConnection(url: string, publishableKey: string) { return createClient(url, publishableKey); }
export async function getOwnNeeds(url: string, publishableKey: string) { const client = createSupabaseConnection(url, publishableKey); const { data, error } = await client.from('needs').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; }
