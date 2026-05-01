import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { hashCode } from "@/lib/server/password";
import { isEmail } from "@/lib/server/validation";
import { sendPasswordResetCode } from "@/lib/server/email";

export async function POST(request: Request) {
  try {
    const { email: rawEmail } = await request.json();
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!isEmail(email)) return NextResponse.json({ ok: false, message: "Email invalido." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: user } = await supabase.from("users").select("id, email").eq("email", email).maybeSingle();
    if (!user) return NextResponse.json({ ok: true, message: "Se esse email existir, enviaremos um codigo." });

    const code = String(randomInt(100000, 1000000));
    await supabase.from("password_reset_codes").insert({
      user_id: user.id,
      code_hash: hashCode(code),
      expires_at: new Date(Date.now() + 1000 * 60 * 15).toISOString()
    });
    await sendPasswordResetCode(user.email, code);
    return NextResponse.json({ ok: true, message: "Codigo enviado para seu email." });
  } catch {
    return NextResponse.json({ ok: false, message: "Nao foi possivel iniciar a recuperacao." }, { status: 500 });
  }
}
