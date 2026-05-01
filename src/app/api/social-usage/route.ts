import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Sessao expirada." }, { status: 401 });
  const body = await request.json();
  const appName = String(body.appName || "").trim().slice(0, 80);
  const minutesSpent = Math.max(0, Number(body.minutesSpent || 0));
  if (!appName) return NextResponse.json({ ok: false, message: "Informe o aplicativo." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("social_usage_logs")
    .insert({
      user_id: session.userId,
      usage_date: String(body.usageDate || new Date().toISOString().slice(0, 10)),
      app_name: appName,
      minutes_spent: minutesSpent,
      screenshot_url: body.screenshotUrl || null,
      notes: String(body.notes || "").slice(0, 1000),
      source: "manual"
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ ok: false, message: "Nao foi possivel registrar o uso." }, { status: 500 });
  return NextResponse.json({ ok: true, log: data });
}
