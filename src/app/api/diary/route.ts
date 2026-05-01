import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("diary_entries").select("*").eq("user_id", session.userId).order("entry_date", { ascending: false }).limit(60);
  return NextResponse.json({ ok: true, entries: data ?? [] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });
  const body = await request.json();
  const content = String(body.content || "").trim();
  const mood = Number(body.mood || 5);
  const progress = Number(body.progress || 0);
  const tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 12) : [];
  if (content.length < 20) return NextResponse.json({ ok: false, message: "Escreva pelo menos 20 caracteres no diario." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const entry = {
    user_id: session.userId,
    entry_date: new Date().toISOString().slice(0, 10),
    content,
    mood: Math.min(10, Math.max(1, mood)),
    progress: Math.min(100, Math.max(0, progress)),
    tags,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from("diary_entries").upsert(entry, { onConflict: "user_id,entry_date" }).select("*").single();
  if (error) return NextResponse.json({ ok: false, message: "Nao foi possivel salvar o diario." }, { status: 500 });
  return NextResponse.json({ ok: true, entry: data });
}
