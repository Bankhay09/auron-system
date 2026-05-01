export const SUPABASE_PUBLIC_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://groyrawbdtircllgkxpm.supabase.co";

export const SUPABASE_PUBLIC_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdyb3lyYXdiZHRpcmNsbGdreHBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDAyOTUsImV4cCI6MjA5MzIxNjI5NX0.H5aA1X3DS0dt8U3fsVprEGqsF_43sKwEajMiPnfZBds";

export const isSupabasePublicConfigured = Boolean(SUPABASE_PUBLIC_URL && SUPABASE_PUBLIC_ANON_KEY);
