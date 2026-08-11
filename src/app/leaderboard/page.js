"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="#8B9296" strokeWidth="1.6" />
      <path
        d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"
        stroke="#8B9296"
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
              Competição
            </p>
            <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[22px] text-[#E9E7E0]">
              Ranking
            </h1>
          </div>
          <a
            href="/"
            className="text-[13px] text-[#8B9296] hover:text-[#E9E7E0] transition"
          >
            ← Home
          </a>
        </div>

        {erro && (
          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
            <p className="text-[13px] text-[#E2534A]">{erro}</p>
          </div>
        )}

        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
          <p className="text-[12px] text-[#8B9296]">
            Pontos: <span className="text-[#E9E7E0]">dia concluído</span> vale
            10, <span className="text-[#E9E7E0]">simulado registrado</span> vale
            15, <span className="text-[#E9E7E0]">meta de TAF batida</span> vale
            5. Quanto mais consistente, mais pontos — não importa quantas horas.
          </p>
        </div>

        {ranking.length === 0 && !erro ? (
          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5">
            <p className="text-[13px] text-[#8B9296]">
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
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    éVoce
                      ? "border-[#5C4A1A] bg-[#1F1B0D]"
                      : "border-[#2A2E31] bg-[#1D2124]"
                  }`}
                >
                  <div className="w-6 text-center text-[13px] font-medium text-[#8B9296] shrink-0 font-[family-name:var(--font-geist-mono)]">
                    {medalha(i) || i + 1}
                  </div>

                  <div className="w-9 h-9 rounded-full bg-[#14171A] border border-[#2A2E31] flex items-center justify-center overflow-hidden shrink-0">
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
                    <p className="text-[13px] font-medium text-[#E9E7E0] truncate">
                      {r.nome || "Candidato"}
                      {éVoce && (
                        <span className="text-[11px] text-[#DBAF2C] font-normal ml-1.5">
                          (você)
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#8B9296]">
                      {r.dias_concluidos} dias · {r.simulados_feitos} simulados
                      · {r.metas_batidas} metas
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-[family-name:var(--font-geist-mono)] text-[19px] text-[#C9A227] leading-none">
                      {r.pontos}
                    </p>
                    <p className="text-[10px] text-[#8B9296]">pontos</p>
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
