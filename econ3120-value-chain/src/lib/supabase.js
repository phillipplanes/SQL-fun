import { createClient } from "@supabase/supabase-js";

// This app shares the SQL Royale Supabase project (same one the live quiz uses).
// The anon key is designed to be public in front-end apps; the schema
// (supabase/schema.sql) restricts writes to the five known entity teams.
//
// Defaults point at the shared project. Vite env vars (VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY) override them if you ever split onto a new project.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://bnncmkwzuduimpkjniur.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_iFZB4kApTYnkavLk3XPQVw_paYTcHl5";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = true;
