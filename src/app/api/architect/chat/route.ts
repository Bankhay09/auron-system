import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { readDevDb, shouldUseDevDb, writeDevDb } from "@/lib/server/dev-db";

const FIRST_MESSAGE = "Eu sou o Arquiteto. Não estou aqui para te confortar com mentiras, mas para te ajudar a construir a versão que você prometeu ser. Escreva seu diário, cumpra seus pactos e eu analisarei seus padrões.";
const rateLimit = new Map<string, number[]>();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });

  if (shouldUseDevDb()) {
    const db = readDevDb();
    const messages = db.aiMessages.filter((message: any) => message.user_id === session.userId).slice(-50);
    if (!messages.length) return NextResponse.json({ ok: true, messages: [systemIntro(session.userId)] });
    return NextResponse.json({ ok: true, messages });
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("ai_messages").select("id, role, content, created_at").eq("user_id", session.userId).order("created_at", { ascending: true }).limit(50);
  return NextResponse.json({ ok: true, messages: data?.length ? data : [systemIntro(session.userId)] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });
  if (!allowMessage(session.userId)) return NextResponse.json({ ok: false, message: "Aguarde um pouco antes de enviar outra mensagem." }, { status: 429 });

  const body = await request.json();
  const content = sanitize(String(body.content || ""));
  if (content.length < 1) return NextResponse.json({ ok: false, message: "Escreva uma mensagem." }, { status: 400 });
  if (content.length > 1200) return NextResponse.json({ ok: false, message: "Mensagem muito longa." }, { status: 400 });

  const context = await loadContext(session.userId);
  const answer = await askArchitect(content, context);
  const userMessage = { id: crypto.randomUUID(), user_id: session.userId, role: "user", content, created_at: new Date().toISOString() };
  const assistantMessage = { id: crypto.randomUUID(), user_id: session.userId, role: "assistant", content: answer, created_at: new Date().toISOString() };

  if (shouldUseDevDb()) {
    const db = readDevDb();
    db.aiMessages.push(userMessage, assistantMessage);
    writeDevDb(db);
  } else {
    const supabase = getSupabaseAdmin();
    await supabase.from("ai_messages").insert([
      { user_id: session.userId, role: "user", content },
      { user_id: session.userId, role: "assistant", content: answer }
    ]);
  }

  return NextResponse.json({ ok: true, messages: [userMessage, assistantMessage] });
}

async function loadContext(userId: string) {
  if (shouldUseDevDb()) {
    const db = readDevDb();
    const user = db.users.find((item) => item.id === userId);
    const diary = db.diaryEntries.filter((entry) => entry.user_id === userId).sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0];
    return { onboarding: user?.onboarding_data, latestDiary: diary, metrics: { diaryDays: db.diaryEntries.filter((entry) => entry.user_id === userId).length } };
  }
  const supabase = getSupabaseAdmin();
  const [{ data: user }, { data: diary }] = await Promise.all([
    supabase.from("users").select("onboarding_data").eq("id", userId).maybeSingle(),
    supabase.from("diary_entries").select("*").eq("user_id", userId).order("entry_date", { ascending: false }).limit(1).maybeSingle()
  ]);
  return { onboarding: user?.onboarding_data, latestDiary: diary, metrics: {} };
}

async function askArchitect(content: string, context: unknown) {
  const apiKey = process.env.AI_API_KEY;
  const system = `Voce e o Arquiteto do Auron System: mentor sombrio, elegante, direto, disciplinado, filosofico e estrategico. Responda em portugues, de forma firme sem ofender. Use contexto real do usuario. Contexto: ${JSON.stringify(context).slice(0, 5000)}`;
  if (!apiKey) {
    return "Eu ouvi. Agora transforme isso em ato: escolha uma tarefa pequena, conclua antes de negociar consigo mesmo, e registre no diario o que tentou te desviar.";
  }
  const res = await fetch(process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content }
      ]
    })
  });
  if (!res.ok) throw new Error("Falha na IA.");
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Nao consegui formar uma resposta agora.";
}

function systemIntro(userId: string) {
  return { id: "architect-intro", user_id: userId, role: "assistant", content: FIRST_MESSAGE, created_at: new Date().toISOString() };
}

function sanitize(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

function allowMessage(userId: string) {
  const now = Date.now();
  const recent = (rateLimit.get(userId) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 12) return false;
  recent.push(now);
  rateLimit.set(userId, recent);
  return true;
}
