import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { readDevDb, shouldUseDevDb, writeDevDb } from "@/lib/server/dev-db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });

  const { diaryEntryId, content } = await request.json();
  const prompt = buildArchitectPrompt(String(content || ""));
  const response = await askAI(prompt);

  if (shouldUseDevDb()) {
    const db = readDevDb();
    db.aiMessages.push({ user_id: session.userId, role: "assistant", content: JSON.stringify(response), diary_entry_id: diaryEntryId || null, prompt, created_at: new Date().toISOString() });
    writeDevDb(db);
    return NextResponse.json({ ok: true, architect: response });
  }

  const supabase = getSupabaseAdmin();
  await supabase.from("ai_messages").insert({
    user_id: session.userId,
    role: "assistant",
    content: JSON.stringify(response)
  });

  return NextResponse.json({ ok: true, architect: response });
}

function buildArchitectPrompt(content: string) {
  return `Voce e o Arquiteto, mentor estoico e direto do Auron System. Analise o diario do usuario e responda em JSON com reflection, directAdvice, negativePatternAlert, nextDaySuggestion. Diario: ${content.slice(0, 6000)}`;
}

async function askAI(prompt: string) {
  const apiKey = process.env.AI_API_KEY;
  const apiUrl = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  if (!apiKey) {
    return {
      reflection: "Eu sou o Arquiteto. Ainda sem chave de IA, posso operar em modo local: observe seus atos, nao suas intencoes.",
      directAdvice: "Escreva o proximo passo concreto e execute antes de buscar motivacao.",
      negativePatternAlert: "Sem dados suficientes para detectar padroes.",
      nextDaySuggestion: "Comece o dia com uma acao pequena, mensuravel e sem negociacao."
    };
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  });
  if (!res.ok) throw new Error("Falha na IA.");
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}
