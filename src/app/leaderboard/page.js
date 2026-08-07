"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#8A8360" strokeWidth="1.6" />
      <path
        d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
        stroke="#8A8360"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function medalha(posicao) {
  if (posicao === 0) return "🥇";
  if (posicao === 1) return "🥈";
  if (posicao === 2) return "🥉";
  return null;
}

export default function LeaderboardPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const { data, error } = await supabase.rpc("get_leaderboard");

      if (error) {
        setErro(
          "Não deu pra carregar o ranking. Confere se a função get_leaderboard já foi criada no Supabase.",
        );
      } else {
        setRanking(data || []);
      }
      setCarregando(false);
    }
    carregar();
  }, []);

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
              Competição
            </p>
            <h1 className="font-serif text-[24px] text-[#1B1F1D]">Ranking</h1>
          </div>
          <a
            href="/"
            className="text-[13px] text-[#6B6B63] hover:text-[#1B1F1D] transition"
          >
            ← Home
          </a>
        </div>

        {erro && (
          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4">
            <p className="text-[13px] text-[#C4644B]">{erro}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4">
          <p className="text-[12px] text-[#6B6B63]">
            Pontos: <span className="text-[#1B1F1D]">dia concluído</span> vale
            10, <span className="text-[#1B1F1D]">simulado registrado</span> vale
            15, <span className="text-[#1B1F1D]">meta de TAF batida</span> vale
            5. Quanto mais consistente, mais pontos — não importa quantas horas.
          </p>
        </div>

        {ranking.length === 0 && !erro ? (
          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
            <p className="text-[13px] text-[#8A8360]">
              Ainda não há ninguém no ranking. Registre um dia pra aparecer
              aqui!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((r, i) => {
              const éVoce = r.user_id === userId;
              return (
                <div
                  key={r.user_id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    éVoce
                      ? "border-[#2F4A3D]/40 bg-[#EAF0EC]"
                      : "border-[#E4E1DA] bg-white"
                  }`}
                >
                  <div className="w-6 text-center text-[13px] font-medium text-[#8A8360] shrink-0">
                    {medalha(i) || i + 1}
                  </div>

                  <div className="w-9 h-9 rounded-full bg-[#F2F1EC] border border-[#E4E1DA] flex items-center justify-center overflow-hidden shrink-0">
                    {r.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#1B1F1D] truncate">
                      {r.nome || "Candidato"}
                      {éVoce && (
                        <span className="text-[11px] text-[#2F4A3D] font-normal ml-1.5">
                          (você)
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#6B6B63]">
                      {r.dias_concluidos} dias · {r.simulados_feitos} simulados
                      · {r.metas_batidas} metas
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-serif text-[20px] text-[#1B1F1D] leading-none">
                      {r.pontos}
                    </p>
                    <p className="text-[10px] text-[#6B6B63]">pontos</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
