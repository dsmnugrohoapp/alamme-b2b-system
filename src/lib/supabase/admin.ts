import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// PENTING: hanya boleh dipakai di kode server (Server Component / Server Action).
// Memakai service_role key yang MELEWATI semua RLS — jangan pernah diimpor di komponen 'use client'.
// Dipakai khusus untuk halaman publik /order/[token] (customer belum tentu login),
// dengan pembatasan akses ditulis manual di kode (WHERE order_token = ...), bukan lewat RLS.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
