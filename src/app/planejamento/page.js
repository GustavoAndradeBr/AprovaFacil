"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeLocalStr } from "@/lib/date";

function calcularSemanaAtual(dataInicio, hoje, ultimaSemanaDisponivel) {
  if (!dataInicio) return 1;

  const inicio = new Date(dataInicio + "T00:00:00");
  const agora = new Date(hoje + "T00:00:00");
  const diasPassados = Math.floor((agora - inicio) / (1000 * 60 * 60 * 24));

  if (diasPassados < 0) return 1;

  const semanaCalculada = Math.floor(diasPassados / 7) + 1;

  if (ultimaSemanaDisponivel && semanaCalculada > ultimaSemanaDisponivel) {
    return ultimaSemanaDisponivel;
  }

  return semanaCalculada;
}

export default function PlanejamentoPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [semanaNumero, setSemanaNumero] = useState(null);
  const [itens, setItens] = useState([]);
  const [progresso, setProgresso] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvo, setSalvo] = useState("");

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: config }, { data: ultimaSemana }] = await Promise.all([
        supabase
          .from("configuracao")
          .select("data_inicio_plano")
          .eq("id", 1)
          .single(),
        supabase
          .from("semana_itens")
          .select("semana_numero")
          .order("semana_numero", { ascending: false })
          .limit(1),
      ]);

      const ultimaDisponivel = ultimaSemana?.[0]?.semana_numero ?? 1;
      const numero = calcularSemanaAtual(
        config?.data_inicio_plano,
        hojeLocalStr(),
        ultimaDisponivel,
      );
      setSemanaNumero(numero);

      const [{ data: itensSemana }, { data: prog }] = await Promise.all([
        supabase
          .from("semana_itens")
          .select("*")
          .eq("semana_numero", numero)
          .order("ordem"),
        supabase.from("semana_progresso").select("*").eq("user_id", user.id),
      ]);

      setItens(itensSemana || []);

      const progMap = {};
      (prog || []).forEach((p) => {
        progMap[p.item_id] = p.concluido;
      });
      setProgresso(progMap);

      setCarregando(false);
    }
    carregar();
  }, []);

  async function toggle(itemId) {
    const novoValor = !progresso[itemId];
    setProgresso((prev) => ({ ...prev, [itemId]: novoValor }));

    await supabase
      .from("semana_progresso")
      .upsert(
        { user_id: userId, item_id: itemId, concluido: novoValor },
        { onConflict: "user_id,item_id" },
      );
    setSalvo("Salvo");
    setTimeout(() => setSalvo(""), 1200);
  }

  const feitos = itens.filter((i) => progresso[i.id]).length;
  const percent = itens.length ? Math.round((feitos / itens.length) * 100) : 0;

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#14171A] flex items-center justify-center">
        <p className="text-[#8B9296] text-sm animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14171A] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#8B9296] font-medium mb-1">
              Semana {semanaNumero}
            </p>
            <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[22px] text-[#E9E7E0]">
              Planejamento da semana
            </h1>
          </div>
          <a
            href="/"
            className="text-[13px] text-[#8B9296] hover:text-[#E9E7E0] transition"
          >
            ← Home
          </a>
        </div>

        <div
          className={`fixed top-6 right-6 bg-[#C9A227] text-[#1D1503] text-[13px] font-medium px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            salvo
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          {salvo}
        </div>

        {itens.length === 0 && (
          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
            <p className="text-[13px] text-[#8B9296]">
              Ainda não tem itens cadastrados pra Semana {semanaNumero}.
              Cadastre os itens dessa semana em <code>semana_itens</code> pra
              esse planejamento aparecer aqui.
            </p>
          </div>
        )}

        {itens.length > 0 && (
          <>
            <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[13px] font-medium text-[#E9E7E0]">
                  Progresso da semana
                </p>
                <p className="text-[12px] text-[#DBAF2C] font-medium font-[family-name:var(--font-geist-mono)]">
                  {percent}%
                </p>
              </div>
              <div className="w-full h-1.5 bg-[#14171A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7A9770] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 space-y-2">
              {itens.map((item) => {
                const feito = !!progresso[item.id];
                return (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors select-none ${
                      feito
                        ? "border-[#3A4A35] bg-[#1F2A1D]"
                        : "border-[#2A2E31] bg-[#14171A]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={feito}
                      onChange={() => toggle(item.id)}
                      className="w-4 h-4 accent-[#C9A227]"
                    />
                    <span
                      className={`text-[13px] ${feito ? "text-[#7A9770] line-through" : "text-[#E9E7E0]"}`}
                    >
                      {item.titulo}
                    </span>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
