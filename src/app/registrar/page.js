"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeLocalStr } from "@/lib/date";
import ResetarDiaButton from "@/components/ResetarDiaButton";

const TAF_LABELS = {
  flexao_braco: "Flexão de braço",
  abdominal: "Abdominal",
  corrida_50m: "Corrida 50m (segundos)",
  corrida_12min: "Corrida 12min (metros)",
};

export default function RegistrarPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [materias, setMaterias] = useState([]);
  const [progresso, setProgresso] = useState({});
  const [dia, setDia] = useState({
    horas_estudadas: 0,
    questoes_resolvidas: 0,
    concluido: false,
  });
  const [tafMetas, setTafMetas] = useState({});
  const [tafValores, setTafValores] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvo, setSalvo] = useState("");

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [
        { data: mats },
        { data: assuntos },
        { data: prog },
        { data: diaHoje },
        { data: metas },
        { data: registrosHoje },
      ] = await Promise.all([
        supabase.from("materias").select("id, nome, ordem").order("ordem"),
        supabase
          .from("assuntos")
          .select("id, materia_id, nome, ordem")
          .order("ordem"),
        supabase.from("assunto_progresso").select("*").eq("user_id", user.id),
        supabase
          .from("dias")
          .select("*")
          .eq("user_id", user.id)
          .eq("data", hojeLocalStr())
          .maybeSingle(),
        supabase.from("taf_metas").select("tipo, meta").eq("user_id", user.id),
        supabase
          .from("taf_registros")
          .select("tipo, valor")
          .eq("user_id", user.id)
          .eq("data", hojeLocalStr()),
      ]);

      const materiasComAssuntos = (mats || []).map((m) => ({
        ...m,
        assuntos: (assuntos || []).filter((a) => a.materia_id === m.id),
      }));
      setMaterias(materiasComAssuntos);

      const progMap = {};
      (prog || []).forEach((p) => {
        progMap[p.assunto_id] = p;
      });
      setProgresso(progMap);

      if (diaHoje) setDia(diaHoje);

      const metasMap = {};
      (metas || []).forEach((m) => {
        metasMap[m.tipo] = m.meta;
      });
      setTafMetas(metasMap);

      const valoresMap = {};
      (registrosHoje || []).forEach((r) => {
        valoresMap[r.tipo] = r.valor;
      });
      setTafValores(valoresMap);

      setCarregando(false);
    }
    carregar();
  }, []);

  function flash(msg) {
    setSalvo(msg);
    setTimeout(() => setSalvo(""), 1500);
  }

  async function toggleItem(assuntoId, campo) {
    const atual = progresso[assuntoId] || {};
    const novoValor = !atual[campo];
    const atualizado = {
      ...atual,
      [campo]: novoValor,
      user_id: userId,
      assunto_id: assuntoId,
    };

    setProgresso((prev) => ({ ...prev, [assuntoId]: atualizado }));

    await supabase
      .from("assunto_progresso")
      .upsert(atualizado, { onConflict: "user_id,assunto_id" });
    flash("Salvo");
  }

  async function salvarDia() {
    const atualizado = { ...dia, user_id: userId, data: hojeLocalStr() };
    await supabase
      .from("dias")
      .upsert(atualizado, { onConflict: "user_id,data" });
    flash("Dia salvo");
  }

  async function salvarTaf(tipo, valor) {
    setTafValores((prev) => ({ ...prev, [tipo]: valor }));
    await supabase
      .from("taf_registros")
      .upsert(
        { user_id: userId, tipo, valor, data: hojeLocalStr() },
        { onConflict: "user_id,tipo,data" },
      );
    flash("TAF salvo");
  }

  function percentMateria(materia) {
    if (!materia.assuntos.length) return 0;
    const feitos = materia.assuntos.filter((a) => {
      const p = progresso[a.id];
      return (
        p &&
        p.aula_concluida &&
        p.resumo_feito &&
        p.questoes_concluidas &&
        p.revisao_realizada
      );
    }).length;
    return Math.round((feitos / materia.assuntos.length) * 100);
  }

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
              Registro do dia
            </p>
            <h1 className="font-serif text-[24px] text-[#1B1F1D]">
              O que você fez hoje?
            </h1>
          </div>
          <a
            href="/"
            className="text-[13px] text-[#6B6B63] hover:text-[#1B1F1D] transition"
          >
            ← Home
          </a>
        </div>

        {/* toast simples */}
        <div
          className={`fixed top-6 right-6 bg-[#1B1F1D] text-white text-[13px] px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
            salvo
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          {salvo}
        </div>

        {/* Horas e questões do dia */}
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-[#1B1F1D]">
              Resumo do dia
            </p>
            <ResetarDiaButton
              userId={userId}
              onReset={() => window.location.reload()}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[12px] text-[#6B6B63] mb-1">
                Horas estudadas
              </label>
              <input
                type="number"
                max="24"
                min="0"
                step="0.5"
                value={dia.horas_estudadas}
                onChange={(e) =>
                  setDia({
                    ...dia,
                    horas_estudadas: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#6B6B63] mb-1">
                Questões resolvidas
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={dia.questoes_resolvidas}
                onChange={(e) =>
                  setDia({
                    ...dia,
                    questoes_resolvidas: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dia.concluido}
              onChange={(e) => setDia({ ...dia, concluido: e.target.checked })}
              className="w-4 h-4 accent-[#2F4A3D]"
            />
            <span className="text-[13px] text-[#1B1F1D]">
              Marcar hoje como dia concluído
            </span>
          </label>

          <button
            onClick={salvarDia}
            className="w-full py-2 rounded-lg bg-[#1B1F1D] hover:bg-[#2F4A3D] text-white text-sm font-medium transition"
          >
            Salvar dia
          </button>
        </div>

        {/* Edital */}
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4">
          <p className="text-[13px] font-medium text-[#1B1F1D] mb-4">Edital</p>

          <div className="space-y-5">
            {materias.map((materia) => {
              const percent = percentMateria(materia);
              return (
                <div key={materia.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[13px] font-medium text-[#1B1F1D]">
                      {materia.nome}
                    </p>
                    <p className="text-[12px] text-[#8A8360] font-medium">
                      {percent}%
                    </p>
                  </div>
                  <div className="w-full h-1.5 bg-[#EDEBE5] rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-[#2F4A3D] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {materia.assuntos.map((assunto) => {
                      const p = progresso[assunto.id] || {};
                      const completo =
                        p.aula_concluida &&
                        p.resumo_feito &&
                        p.questoes_concluidas &&
                        p.revisao_realizada;
                      return (
                        <div
                          key={assunto.id}
                          className={`rounded-lg border px-3 py-2.5 transition-colors ${
                            completo
                              ? "border-[#2F4A3D]/30 bg-[#EAF0EC]"
                              : "border-[#E4E1DA] bg-[#FAFAF8]"
                          }`}
                        >
                          <p className="text-[13px] text-[#1B1F1D] mb-2">
                            {assunto.nome}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {[
                              ["aula_concluida", "Aula"],
                              ["resumo_feito", "Resumo"],
                              ["questoes_concluidas", "Questões"],
                              ["revisao_realizada", "Revisão"],
                            ].map(([campo, label]) => (
                              <label
                                key={campo}
                                className="flex items-center gap-1.5 text-[12px] text-[#6B6B63] cursor-pointer select-none"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!p[campo]}
                                  onChange={() => toggleItem(assunto.id, campo)}
                                  className="w-3.5 h-3.5 accent-[#2F4A3D]"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TAF */}
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-8">
          <p className="text-[13px] font-medium text-[#1B1F1D] mb-4">
            TAF de hoje
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(TAF_LABELS).map(([tipo, label]) => {
              const meta = tafMetas[tipo];
              const valor = tafValores[tipo] ?? "";
              const menorMelhor = tipo === "corrida_50m";
              const bateuMeta =
                valor !== "" &&
                meta != null &&
                (menorMelhor ? Number(valor) <= meta : Number(valor) >= meta);
              return (
                <div
                  key={tipo}
                  className="rounded-lg border border-[#E4E1DA] bg-[#FAFAF8] p-3"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] text-[#1B1F1D]">
                      {label}
                    </label>
                    {meta != null && (
                      <span className="text-[15px] text-[#8A8360]">
                        meta: {meta}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={tipo === "corrida_50m" ? 5 : 0}
                      step={
                        tipo === "corrida_50m"
                          ? 0.5
                          : tipo === "corrida_12min"
                            ? 100
                            : 1
                      }
                      value={valor}
                      onChange={(e) => {
                        const numero =
                          tipo === "corrida_50m"
                            ? Math.max(5, parseFloat(e.target.value) || 5)
                            : Math.max(0, parseFloat(e.target.value) || 0);

                        salvarTaf(tipo, numero);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-[#D0CBC2] text-[#2E2E2E] placeholder:text-[#6B6B63] font-medium text-sm focus:outline-none focus:border-[#2F4A3D] focus:ring-2 focus:ring-[#2F4A3D]/20 transition"
                    />
                    {valor !== "" && meta != null && (
                      <span
                        className={`text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
                          bateuMeta
                            ? "bg-[#EAF0EC] text-[#1cbe70]"
                            : "bg-[#F5E9E5] text-[#ff0000]"
                        }`}
                      >
                        {bateuMeta ? "✓ meta batida" : "abaixo da meta"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
