"use client";

import { useState } from "react";
import Link from "next/link";
import { isSupabasePublicConfigured } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot" | "reset";

export function AuthForm({ mode, onSuccess }: { mode: Mode; onSuccess?: (data: any) => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabasePublicConfigured) {
      setMessage("Configuracao publica do Supabase incompleta. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const endpoint = {
      login: "/api/auth/login",
      register: "/api/auth/register",
      forgot: "/api/auth/forgot-password",
      reset: "/api/auth/reset-password"
    }[mode];

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(publicErrorMessage(data.message));
      return;
    }
    if (data.redirectTo && onSuccess) onSuccess(data);
    else if (data.redirectTo) window.location.href = data.redirectTo;
    else setMessage(data.message || "Operacao concluida.");
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      {mode === "register" && <Field name="username" label="Nome de usuario" autoComplete="username" />}
      {mode === "login" && <Field name="login" label="Email" autoComplete="username" />}
      {(mode === "register" || mode === "forgot" || mode === "reset") && <Field name="email" label="Email" type="email" autoComplete="email" />}
      {mode === "reset" && <Field name="code" label="Codigo de 6 digitos" inputMode="numeric" />}
      {(mode === "login" || mode === "register" || mode === "reset") && <Field name="password" label={mode === "reset" ? "Nova senha" : "Senha"} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} />}
      {message && <div className="rounded-lg border border-[#9b1c1c]/50 bg-[#2a0909]/60 p-3 text-sm text-[#ffd6c9]">{message}</div>}
      <button disabled={loading} className="min-h-12 rounded-xl border border-[#b99654]/70 bg-[#7a1515]/40 px-4 font-black uppercase tracking-[0.16em] text-white shadow-[0_0_24px_rgba(185,150,84,0.22)] disabled:opacity-50">
        {loading ? "Processando..." : buttonLabel(mode)}
      </button>
      <div className="flex flex-wrap justify-between gap-3 text-sm text-[#bda889]">
        {mode !== "login" && <Link href="/login">Entrar</Link>}
        {mode === "login" && <Link href="/register">Criar conta</Link>}
        {mode === "login" && <Link href="/forgot-password">Esqueci minha senha</Link>}
        {mode === "forgot" && <Link href="/reset-password">Ja tenho o codigo</Link>}
      </div>
    </form>
  );
}

function publicErrorMessage(message?: string) {
  if (!message) return "Algo falhou. Tente novamente.";
  if (/Supabase nao configurado|Supabase backend nao configurado|variaveis de ambiente/i.test(message)) {
    return "Banco de dados indisponivel no servidor. Tente novamente em instantes.";
  }
  return message;
}

function Field(props: { name: string; label: string; type?: string; autoComplete?: string; inputMode?: "numeric" }) {
  return (
    <label className="grid gap-2 text-sm text-[#bda889]">
      {props.label}
      <input
        required
        name={props.name}
        type={props.type || "text"}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        className="min-h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-[#b99654]"
      />
    </label>
  );
}

function buttonLabel(mode: Mode) {
  if (mode === "register") return "Cadastrar";
  if (mode === "forgot") return "Enviar codigo";
  if (mode === "reset") return "Redefinir senha";
  return "Entrar";
}
