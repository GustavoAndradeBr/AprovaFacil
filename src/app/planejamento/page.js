"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

      // pega a semana mais recente cadastrada (a "atual")
      const { data: semanas } = await supabase
        .from("semana_itens")
        .select("semana_numero")
        .order("semana_numero", { ascending: false })
        .limit(1);

      const numero = semanas?.[0]?.semana_numero ?? 1;
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
              Semana {semanaNumero}
            </p>
            <h1 className="font-serif text-[24px] text-[#1B1F1D]">
              Planejamento da semana
            </h1>
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

        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[13px] font-medium text-[#1B1F1D]">
              Progresso da semana
            </p>
            <p className="text-[12px] text-[#8A8360] font-medium">{percent}%</p>
          </div>
          <div className="w-full h-1.5 bg-[#EDEBE5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2F4A3D] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 space-y-2">
          {itens.map((item) => {
            const feito = !!progresso[item.id];
            return (
              <label
                key={item.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors select-none ${
                  feito
                    ? "border-[#2F4A3D]/30 bg-[#EAF0EC]"
                    : "border-[#E4E1DA] bg-[#FAFAF8]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={feito}
                  onChange={() => toggle(item.id)}
                  className="w-4 h-4 accent-[#2F4A3D]"
                />
                <span
                  className={`text-[13px] ${feito ? "text-[#2F4A3D] line-through" : "text-[#1B1F1D]"}`}
                >
                  {item.titulo}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
