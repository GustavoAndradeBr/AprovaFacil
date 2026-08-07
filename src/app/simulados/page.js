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
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
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

    // Atualiza a lista local na hora, sem esperar a resposta do servidor
    setSimulados((prev) => prev.filter((s) => s.id !== id));

    const { error } = await supabase
      .from("simulados")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      // Se der erro, recarrega do banco pra não ficar com estado errado
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
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center">
        <p className="text-[#8A8360] text-sm animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#8A8360] font-medium mb-1">
              Evolução
            </p>
            <h1 className="font-serif text-[24px] text-[#1B1F1D]">Simulados</h1>
          </div>
          <a
            href="/"
            className="text-[13px] text-[#6B6B63] hover:text-[#1B1F1D] transition"
          >
            ← Home
          </a>
        </div>

        <div
          className={`fixed top-6 right-6 bg-[#1B1F1D] text-white text-[13px] px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            salvo
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          {salvo}
        </div>

        {/* Formulário de novo simulado */}
        <form
          onSubmit={salvar}
          className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4"
        >
          <p className="text-[13px] font-medium text-[#1B1F1D] mb-3">
            Registrar novo simulado
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[12px] text-[#6B6B63] mb-1">
                Data
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#6B6B63] mb-1">
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
                className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#6B6B63] mb-1">
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
                className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={salvando}
            className="w-full py-2 rounded-lg bg-[#1B1F1D] hover:bg-[#2F4A3D] text-white text-sm font-medium transition disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Adicionar simulado"}
          </button>
        </form>

        {/* Histórico */}
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
          <p className="text-[13px] font-medium text-[#1B1F1D] mb-3">
            Histórico
          </p>

          {simulados.length === 0 ? (
            <p className="text-[13px] text-[#8A8360]">
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
                        ? "border-[#8A8360]/40 bg-[#FBF6EC]"
                        : "border-[#E4E1DA] bg-[#FAFAF8]"
                    }`}
                  >
                    <div>
                      <p className="text-[13px] text-[#1B1F1D]">
                        {formatarData(s.data)}
                      </p>
                      {éMelhor && (
                        <span className="text-[10px] font-medium text-[#8A8360]">
                          melhor resultado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-4 text-right">
                        {s.nota != null && (
                          <div>
                            <p className="text-[15px] font-medium text-[#1B1F1D]">
                              {s.nota}
                            </p>
                            <p className="text-[10px] text-[#6B6B63]">nota</p>
                          </div>
                        )}
                        {s.percentual != null && (
                          <div>
                            <p className="text-[15px] font-medium text-[#1B1F1D]">
                              {s.percentual}%
                            </p>
                            <p className="text-[10px] text-[#6B6B63]">
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
                        className="text-[#B0AA9E] hover:text-[#C4644B] transition-colors disabled:opacity-40 p-1 -mr-1"
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
