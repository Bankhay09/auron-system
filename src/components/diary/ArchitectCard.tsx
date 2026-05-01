export function ArchitectCard({ response }: { response?: Record<string, string> | null }) {
  return (
    <aside className="auron-panel rounded-2xl p-5">
      <div className="flex items-center gap-4">
        <div className="architect-mask">
          <span />
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-[#bda889]">Assistente IA</div>
          <h2 className="text-2xl font-black uppercase text-white">Arquiteto</h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#c8b99d]">
        Eu sou o Arquiteto. Nao venho para consolar seus planos, mas para examinar suas escolhas. Escreva. O padrao aparecera.
      </p>
      {response && (
        <div className="mt-5 grid gap-3 text-sm">
          <Insight title="Reflexao" value={response.reflection} />
          <Insight title="Conselho direto" value={response.directAdvice} />
          <Insight title="Alerta" value={response.negativePatternAlert} />
          <Insight title="Proximo dia" value={response.nextDaySuggestion} />
        </div>
      )}
    </aside>
  );
}

function Insight({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="text-xs uppercase text-[#b99654]">{title}</div>
      <p className="mt-1 leading-6 text-[#f6efe2]">{value || "Aguardando analise."}</p>
    </div>
  );
}
