"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { AuronLogo } from "@/components/AuronLogo";
import { AuthForm } from "./AuthForm";

export function LoginExperience({ mode = "login" }: { mode?: "login" | "register" }) {
  const [phase, setPhase] = useState<"welcome" | "login" | "return">("welcome");
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!frameRef.current) return;
    gsap.fromTo(frameRef.current, { filter: "blur(8px)", scale: 0.96 }, { filter: "blur(0px)", scale: 1, duration: 0.7, ease: "power3.out" });
  }, [phase]);

  function enter() {
    setPhase("login");
  }

  function handleSuccess(data: any) {
    if (mode === "login" && data.redirectTo === "/dashboard") {
      setPhase("return");
      window.setTimeout(() => {
        window.location.href = data.redirectTo;
      }, 1400);
      return;
    }
    window.location.href = data.redirectTo;
  }

  return (
    <main className="system-entry min-h-screen overflow-hidden bg-black px-4 py-8 text-[#e9fbff]">
      <div className="entry-particles" />
      <div className="entry-scan" />
      <section className="grid min-h-[calc(100vh-4rem)] place-items-center">
        <AnimatePresence mode="wait">
          {phase === "welcome" ? (
            <motion.div
              key="welcome"
              ref={frameRef}
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className="system-entry-panel"
            >
              <AuronLogo />
              <h1 className="mt-8 text-center text-4xl font-black uppercase md:text-6xl">Bem-vindo ao Auron System</h1>
              <p className="mx-auto mt-4 max-w-xl text-center text-[#a7f7ff]">Inicializando protocolo de evolucao pessoal.</p>
              <button onClick={enter} className="entry-ok mt-8">OK</button>
            </motion.div>
          ) : phase === "login" ? (
            <motion.div
              key="login"
              ref={frameRef}
              initial={{ opacity: 0, scale: 0.84 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className="system-entry-panel max-w-md"
            >
              <div className="mb-6 flex justify-center"><AuronLogo /></div>
              <div className="mb-6 text-center">
                <div className="text-xs uppercase tracking-[0.28em] text-[#7ff6ff]">Acesso restrito</div>
                <h1 className="mt-2 text-3xl font-black uppercase text-white">{mode === "login" ? "Entrar no sistema" : "Criar identidade"}</h1>
              </div>
              <AuthForm mode={mode} onSuccess={handleSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key="return"
              ref={frameRef}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 130, damping: 15 }}
              className="system-entry-panel max-w-xl text-center"
            >
              <AuronLogo />
              <h1 className="mt-8 text-4xl font-black uppercase text-white">Bem-vindo de volta, jogador.</h1>
              <p className="mt-4 text-[#a7f7ff]">Reativando seu painel de evolução.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}
