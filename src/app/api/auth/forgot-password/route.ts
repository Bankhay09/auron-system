import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isEmail } from "@/lib/server/validation";
import { sendPasswordResetCode } from "@/lib/server/email";
import { generateResetCode, resetCodeExpiresAt, resetCodeHash } from "@/lib/server/reset-codes";

const GENERIC_MESSAGE = "Se este email estiver cadastrado, enviaremos um codigo de recuperacao.";

export async function POST(request: Request) {
  try {
    const { email: rawEmail } = await request.json();
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!isEmail(email)) return NextResponse.json({ ok: false, message: "Email invalido." }, { status: 400 });

    const supabase = getSupabaseAdmin();
    const { data: user, error: userError } = await supabase.from("users").select("id, email").eq("email", email).maybeSingle();
    if (userError) {
      console.error("[api/auth/forgot-password] erro ao buscar usuario", userError);
      return NextResponse.json({ ok: false, message: `Erro Supabase ao buscar usuario: ${userError.message}` }, { status: 500 });
    }
    if (!user) return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });

    const code = generateResetCode();
    const { error: insertError } = await supabase.from("password_reset_codes").insert({
      user_id: user.id,
      email: user.email,
      code,
      code_hash: resetCodeHash(code),
      expires_at: resetCodeExpiresAt(),
      used: false
    });
    if (insertError) {
      console.error("[api/auth/forgot-password] erro ao salvar codigo", insertError);
      return NextResponse.json({ ok: false, message: `Erro Supabase ao salvar codigo: ${insertError.message}` }, { status: 500 });
    }

    await sendPasswordResetCode(user.email, code);
    return NextResponse.json({ ok: true, message: "Codigo enviado para seu email." });
  } catch (caught) {
    console.error("[api/auth/forgot-password] erro ao iniciar recuperacao", formatCaughtError(caught));
    const message = caught instanceof Error ? caught.message : "Nao foi possivel iniciar a recuperacao.";
    return NextResponse.json({ ok: false, message: `Nao foi possivel enviar o codigo: ${message}` }, { status: 500 });
  }
}

function formatCaughtError(caught: unknown) {
  if (caught instanceof Error) return { name: caught.name, message: caught.message, stack: caught.stack };
  return { value: caught };
}
