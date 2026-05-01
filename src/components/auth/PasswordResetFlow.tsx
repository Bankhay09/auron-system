"use client";

import { useState } from "react";
import Link from "next/link";

type Step = "email" | "code" | "password" | "done";

export function PasswordResetFlow() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await post("/api/auth/forgot-password", { email });
    setLoading(false);
    setMessage(response.message);
    if (response.ok) setStep("code");
  }

  async function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await post("/api/auth/verify-reset-code", { email, code });
    setLoading(false);
    setMessage(response.message);
    if (response.ok) setStep("password");
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await post("/api/auth/reset-password", { email, code, password });
    setLoading(false);
    setMessage(response.message);
    if (response.ok) setStep("done");
  }

  return (
    <div className="grid gap-5">
      <StepHeader step={step} />
      {step === "email" && (
        <form onSubmit={submitEmail} className="grid gap-4">
          <Field label="Email cadastrado" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Action loading={loading} label="Enviar codigo" />
        </form>
      )}
      {step === "code" && (
        <form onSubmit={submitCode} className="grid gap-4">
          <Field label="Email" name="email" type="email" value={email} onChange={setEmail} autoComplete="email" />
          <Field label="Codigo de 6 digitos" name="code" value={code} onChange={setCode} inputMode="numeric" maxLength={6} />
          <Action loading={loading} label="Validar codigo" />
        </form>
      )}
      {step === "password" && (
        <form onSubmit={submitPassword} className="grid gap-4">
          <Field label="Nova senha" name="password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
          <Action loading={loading} label="Redefinir senha" />
        </form>
      )}
      {step === "done" && (
        <div className="rounded-xl border border-[var(--auron-success)]/40 bg-[var(--auron-success)]/10 p-4">
          <div className="text-lg font-black uppercase text-white">Senha redefinida</div>
          <p className="mt-2 text-sm text-[#bda889]">Seu acesso foi restaurado. Volte ao login para entrar no sistema.</p>
        </div>
      )}
      {message && (
        <div className={`rounded-lg border p-3 text-sm ${step === "done" ? "border-[var(--auron-success)]/50 bg-[var(--auron-success)]/10 text-[#d8fff7]" : "border-[#9b1c1c]/50 bg-[#2a0909]/60 text-[#ffd6c9]"}`}>
          {message}
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-3 text-sm text-[#bda889]">
        {step !== "email" && step !== "done" && <button type="button" onClick={() => setStep(step === "password" ? "code" : "email")}>Voltar</button>}
        <Link href="/login">Entrar</Link>
      </div>
    </div>
  );
}

function StepHeader({ step }: { step: Step }) {
  const items: Array<{ id: Step; label: string }> = [
    { id: "email", label: "Email" },
    { id: "code", label: "Codigo" },
    { id: "password", label: "Nova senha" }
  ];
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === step));
  return (
    <div className="grid gap-3">
      <div className="flex gap-2">
        {items.map((item, index) => (
          <div key={item.id} className={`h-2 flex-1 rounded-full ${index <= activeIndex ? "bg-[var(--auron-primary)] shadow-neon" : "bg-white/10"}`} />
        ))}
      </div>
      <div className="text-xs uppercase tracking-[0.24em] text-[#7ff6ff]">
        {step === "email" && "Informe seu email"}
        {step === "code" && "Valide o codigo"}
        {step === "password" && "Crie uma nova senha"}
        {step === "done" && "Acesso restaurado"}
      </div>
    </div>
  );
}

function Field(props: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string; inputMode?: "numeric"; maxLength?: number }) {
  return (
    <label className="grid gap-2 text-sm text-[#bda889]">
      {props.label}
      <input
        required
        name={props.name}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
        type={props.type || "text"}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        maxLength={props.maxLength}
        className="min-h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-[#b99654]"
      />
    </label>
  );
}

function Action({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button disabled={loading} className="min-h-12 rounded-xl border border-[#b99654]/70 bg-[#7a1515]/40 px-4 font-black uppercase tracking-[0.16em] text-white shadow-[0_0_24px_rgba(185,150,84,0.22)] disabled:opacity-50">
      {loading ? "Processando..." : label}
    </button>
  );
}

async function post(url: string, body: Record<string, string>) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    message: data.message || (response.ok ? "Operacao concluida." : "Algo falhou. Tente novamente.")
  };
}
