import { createClient } from "@/lib/supabase/server";
import { hojeLocalStr } from "@/lib/date";

function calcularStreak(datasConcluidas, hoje) {
  const set = new Set(datasConcluidas);
  let streak = 0;
  const cursor = new Date(hoje + "T00:00:00");

  if (!set.has(hoje)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const str = cursor.toISOString().slice(0, 10);
    if (set.has(str)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function UserIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
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

export default async function CandidatoPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const hoje = hojeLocalStr();

  const [
    { data: perfil },
    { data: assuntos },
    { data: progresso },
    { data: diasConcluidos },
    { data: dias },
    { data: simulados },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase.from("assuntos").select("id"),
    supabase
      .from("assunto_progresso")
      .select(
        "aula_concluida, resumo_feito, questoes_concluidas, revisao_realizada",
      )
      .eq("user_id", id),
    supabase
      .from("dias")
      .select("data")
      .eq("user_id", id)
      .eq("concluido", true),
    supabase.from("dias").select("horas_estudadas").eq("user_id", id),
    supabase
      .from("simulados")
      .select("percentual")
      .eq("user_id", id)
      .not("percentual", "is", null)
      .order("percentual", { ascending: false })
      .limit(1),
  ]);

  const totalAssuntos = assuntos?.length || 0;
  const assuntosFinalizados = (progresso || []).filter(
    (p) =>
      p.aula_concluida &&
      p.resumo_feito &&
      p.questoes_concluidas &&
      p.revisao_realizada,
  ).length;
  const percentEdital =
    totalAssuntos > 0
      ? Math.round((assuntosFinalizados / totalAssuntos) * 100)
      : 0;

  const streak = calcularStreak(
    (diasConcluidos || []).map((d) => d.data),
    hoje,
  );
  const horasTotais = (dias || []).reduce(
    (soma, d) => soma + (d.horas_estudadas || 0),
    0,
  );
  const melhorSimulado = simulados?.[0]?.percentual ?? null;

  return (
    <div className="min-h-screen bg-[#14171A] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#8B9296] font-medium mb-1">
              Perfil do candidato
            </p>
            <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[22px] text-[#E9E7E0]">
              {perfil?.nome || "Candidato"}
            </h1>
          </div>
          <a
            href="/leaderboard"
            className="text-[13px] text-[#8B9296] hover:text-[#E9E7E0] transition"
          >
            ← Ranking
          </a>
        </div>

        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#14171A] border border-[#2A2E31] flex items-center justify-center overflow-hidden shrink-0">
              {perfil?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={perfil.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-oswald)] font-medium text-[19px] text-[#E9E7E0] truncate">
                {perfil?.nome || "Candidato"}
              </p>
              {perfil?.cargo_pretendido && (
                <p className="text-[12px] text-[#DBAF2C] mt-0.5">
                  {perfil.cargo_pretendido}
                  {perfil?.cidade ? ` · ${perfil.cidade}` : ""}
                </p>
              )}
            </div>
          </div>

          {perfil?.bio && (
            <p className="text-[13px] text-[#B8B5AC] mt-4">{perfil.bio}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1D2124] border-t-2 border-t-[#C9A227] rounded-lg p-5">
            <p className="text-[12px] text-[#8B9296] mb-1">Sequência atual</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[26px] text-[#E9E7E0] leading-none">
              {streak}
            </p>
            <p className="text-[11px] text-[#8B9296] mt-1">
              {streak === 1 ? "dia seguido" : "dias seguidos"}
            </p>
          </div>

          <div className="bg-[#1D2124] border-t-2 border-t-[#3A4A35] rounded-lg p-5">
            <p className="text-[12px] text-[#8B9296] mb-1">Horas totais</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[26px] text-[#E9E7E0] leading-none">
              {horasTotais}h
            </p>
            <p className="text-[11px] text-[#8B9296] mt-1">estudadas</p>
          </div>

          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5">
            <p className="text-[12px] text-[#8B9296] mb-1">Edital</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[26px] text-[#E9E7E0] leading-none">
              {percentEdital}%
            </p>
            <div className="w-full h-1.5 bg-[#14171A] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#7A9770] rounded-full"
                style={{ width: `${percentEdital}%` }}
              />
            </div>
          </div>

          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5">
            <p className="text-[12px] text-[#8B9296] mb-1">Melhor simulado</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[26px] text-[#E9E7E0] leading-none">
              {melhorSimulado != null ? `${melhorSimulado}%` : "–"}
            </p>
            <p className="text-[11px] text-[#8B9296] mt-1">de acertos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
