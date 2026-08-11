"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function hojeStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7H20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 7V4.5C9 3.67 9.67 3 10.5 3H13.5C14.33 3 15 3.67 15 4.5V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 7L6.8 19.2C6.86 20.2 7.7 21 8.7 21H15.3C16.3 21 17.14 20.2 17.2 19.2L18 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 11V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function SimuladosPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [simulados, setSimulados] = useState([]);
  const [data, setData] = useState(hojeStr());
  const [nota, setNota] = useState("");
  const [percentual, setPercentual] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState("");
  const [excluindoId, setExcluindoId] = useState(null);

  async function carregarSimulados(uid) {
    const { data: lista } = await supabase
      .from("simulados")
      .select("*")
      .eq("user_id", uid)
      .order("data", { ascending: false });
    setSimulados(lista || []);
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await carregarSimulados(user.id);
      setCarregando(false);
    }
    iniciar();
  }, []);

  async function salvar(e) {
    e.preventDefault();
    if (!nota && !percentual) return;
    setSalvando(true);

    await supabase.from("simulados").insert({
      user_id: userId,
      data,
      nota: nota ? parseFloat(nota) : null,
      percentual: percentual ? parseFloat(percentual) : null,
    });

    setNota("");
    setPercentual("");
    setData(hojeStr());
    await carregarSimulados(userId);

    setSalvando(false);
    setSalvo("Simulado salvo");
    setTimeout(() => setSalvo(""), 1500);
  }

  async function excluir(id) {
    const confirmar = window.confirm("Excluir este simulado?");
    if (!confirmar) return;

    setExcluindoId(id);
    setSimulados((prev) => prev.filter((s) => s.id !== id));

    const { error } = await supabase
      .from("simulados")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      await carregarSimulados(userId);
      window.alert("Não foi possível excluir. Tente novamente.");
    } else {
      setSalvo("Simulado excluído");
      setTimeout(() => setSalvo(""), 1500);
    }

    setExcluindoId(null);
  }

  const melhorPercentual = simulados.reduce(
    (max, s) =>
      s.percentual != null && s.percentual > max ? s.percentual : max,
    0,
  );

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
              Evolução
            </p>
            <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[22px] text-[#E9E7E0]">
              Simulados
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

        <form
          onSubmit={salvar}
          className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4"
        >
          <p className="text-[13px] font-medium text-[#E9E7E0] mb-3">
            Registrar novo simulado
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[12px] text-[#8B9296] mb-1">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#8B9296] mb-1">
                Nota
              </label>
              <input
                type="number"
                step="1"
                max="10"
                min="0"
                placeholder="0-10"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#8B9296] mb-1">
                % acertos
              </label>
              <input
                type="number"
                step="5"
                max="100"
                min="0"
                placeholder="0-100"
                value={percentual}
                onChange={(e) => setPercentual(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2 rounded-lg bg-[#C9A227] hover:bg-[#DBAF2C] text-[#1D1503] text-sm font-semibold transition disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Adicionar simulado"}
          </button>
        </form>

        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5">
          <p className="text-[13px] font-medium text-[#E9E7E0] mb-3">
            Histórico
          </p>

          {simulados.length === 0 ? (
            <p className="text-[13px] text-[#8B9296]">
              Nenhum simulado registrado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {simulados.map((s) => {
                const éMelhor =
                  s.percentual != null &&
                  s.percentual === melhorPercentual &&
                  melhorPercentual > 0;
                return (
                  <div
                    key={s.id}
                    className={`group flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors ${
                      éMelhor
                        ? "border-[#5C4A1A] bg-[#1F1B0D]"
                        : "border-[#2A2E31] bg-[#14171A]"
                    }`}
                  >
                    <div>
                      <p className="text-[13px] text-[#E9E7E0]">
                        {formatarData(s.data)}
                      </p>
                      {éMelhor && (
                        <span className="text-[10px] font-medium text-[#DBAF2C]">
                          melhor resultado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-4 text-right">
                        {s.nota != null && (
                          <div>
                            <p className="text-[15px] font-medium text-[#E9E7E0] font-[family-name:var(--font-geist-mono)]">
                              {s.nota}
                            </p>
                            <p className="text-[10px] text-[#8B9296]">nota</p>
                          </div>
                        )}
                        {s.percentual != null && (
                          <div>
                            <p className="text-[15px] font-medium text-[#E9E7E0] font-[family-name:var(--font-geist-mono)]">
                              {s.percentual}%
                            </p>
                            <p className="text-[10px] text-[#8B9296]">
                              acertos
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => excluir(s.id)}
                        disabled={excluindoId === s.id}
                        aria-label="Excluir simulado"
                        title="Excluir simulado"
                        className="text-[#5C6165] hover:text-[#E2534A] transition-colors disabled:opacity-40 p-1 -mr-1"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
