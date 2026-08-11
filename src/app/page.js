import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { hojeLocalStr } from "@/lib/date";
import LogoutButton from "@/components/LogoutButton";

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20 6L9 17L4 12"
        stroke="#14171A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 6L6 18"
        stroke="#D64933"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M6 6L18 18"
        stroke="#D64933"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const hoje = hojeLocalStr();
  const inicioMes = hoje.slice(0, 7) + "-01";

  const [
    { data: profile },
    { data: config },
    { data: assuntos },
    { data: progresso },
    { data: diaHoje },
    { data: diasDoMes },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("nome, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase.from("configuracao").select("*").eq("id", 1).single(),
    supabase.from("assuntos").select("id"),
    supabase
      .from("assunto_progresso")
      .select(
        "aula_concluida, resumo_feito, questoes_concluidas, revisao_realizada",
      )
      .eq("user_id", user.id),
    supabase
      .from("dias")
      .select("*")
      .eq("user_id", user.id)
      .eq("data", hoje)
      .maybeSingle(),
    supabase
      .from("dias")
      .select("data, concluido")
      .eq("user_id", user.id)
      .gte("data", inicioMes),
  ]);

  // Dias restantes até a prova
  let diasRestantes = null;
  if (config?.data_prova) {
    const hojeDate = new Date(hoje + "T00:00:00");
    const provaDate = new Date(config.data_prova + "T00:00:00");
    diasRestantes = Math.ceil((provaDate - hojeDate) / (1000 * 60 * 60 * 24));
  }

  // Progresso do edital: um assunto é "finalizado" quando os 4 itens estão marcados
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

  // Calendário do mês atual
  const mapaDoDias = {};
  (diasDoMes || []).forEach((d) => {
    mapaDoDias[d.data] = d.concluido;
  });

  const [ano, mes] = hoje.slice(0, 7).split("-").map(Number);
  const diasNoMes = new Date(ano, mes, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes - 1, 1).getDay();
  const celulas = [];
  for (let i = 0; i < primeiroDiaSemana; i++) celulas.push(null);
  for (let d = 1; d <= diasNoMes; d++) {
    const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    celulas.push({
      dia: d,
      data: dataStr,
      status: mapaDoDias[dataStr],
      hoje: dataStr === hoje,
    });
  }

  return (
    <div className="min-h-screen bg-[#14171A] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <Link href="/perfil" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-full bg-[#1D2124] border border-[#2A2E31] flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#C9A227] transition-colors">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt="Seu avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon />
              )}
            </div>
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#8B9296] font-medium mb-1">
                {config?.nome_concurso || "Concurso"}
              </p>
              <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[24px] text-[#E9E7E0] leading-none group-hover:text-[#C9A227] transition-colors">
                Olá, {profile?.nome?.split(" ")[0] || "candidato"}
              </h1>
            </div>
          </Link>
          <LogoutButton />
        </div>

        {/* Dias restantes + progresso do edital */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#1D2124] border-t-2 border-t-[#C9A227] rounded-lg p-5">
            <p className="text-[12px] text-[#8B9296] mb-1">Faltam</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[32px] text-[#E9E7E0] leading-none">
              {diasRestantes ?? "–"}
            </p>
            <p className="text-[12px] text-[#8B9296] mt-1">dias para a prova</p>
          </div>

          <div className="bg-[#1D2124] border-t-2 border-t-[#3A4A35] rounded-lg p-5">
            <p className="text-[12px] text-[#8B9296] mb-1">Edital</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[32px] text-[#E9E7E0] leading-none">
              {percentEdital}%
            </p>
            <div className="w-full h-1.5 bg-[#14171A] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#7A9770] rounded-full"
                style={{ width: `${percentEdital}%` }}
              />
            </div>
          </div>
        </div>

        {/* Resumo do dia */}
        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-[#E9E7E0]">Hoje</p>
            {diaHoje?.concluido && (
              <span className="text-[11px] font-medium text-[#7A9770] bg-[#3A4A35]/30 px-2 py-0.5 rounded-full">
                Dia concluído
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="font-[family-name:var(--font-geist-mono)] text-[22px] text-[#E9E7E0]">
                {diaHoje?.horas_estudadas ?? 0}h
              </p>
              <p className="text-[11px] text-[#8B9296]">estudadas</p>
            </div>
            <div>
              <p className="font-[family-name:var(--font-geist-mono)] text-[22px] text-[#E9E7E0]">
                {diaHoje?.questoes_resolvidas ?? 0}
              </p>
              <p className="text-[11px] text-[#8B9296]">questões</p>
            </div>
          </div>
        </div>

        {/* Calendário do mês */}
        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-[#E9E7E0]">Este mês</p>
            <div className="flex items-center gap-3 text-[10px] text-[#8B9296]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#C9A227] inline-block" />
                feito
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3A2220] border border-[#5C3530] inline-block" />
                sem registro
              </span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {celulas.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square" />;

              const passou = c.data <= hoje;
              const feito = c.status === true;
              const naoFeito = passou && !feito;

              return (
                <div
                  key={i}
                  title={c.data}
                  className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium font-[family-name:var(--font-geist-mono)] transition-colors
                    ${
                      feito
                        ? "bg-[#C9A227] text-[#14171A]"
                        : naoFeito
                          ? "bg-[#3A2220] text-[#E2534A]"
                          : "bg-[#14171A] text-[#5C6165]"
                    }
                    ${c.hoje ? "ring-2 ring-[#C9A227]" : ""}
                  `}
                >
                  {feito ? <CheckIcon /> : naoFeito ? <XIcon /> : c.dia}
                </div>
              );
            })}
          </div>
        </div>

        <Link
          href="/mural"
          className="block w-full text-center py-3 rounded-lg border border-[#2A2E31] text-[#E9E7E0] hover:border-[#C9A227] hover:text-[#C9A227] text-sm font-medium transition mb-3"
        >
          Mural
        </Link>
        <Link
          href="/planejamento"
          className="block w-full text-center py-3 rounded-lg border border-[#2A2E31] text-[#E9E7E0] hover:border-[#C9A227] hover:text-[#C9A227] text-sm font-medium transition mb-3"
        >
          Ver planejamento da semana
        </Link>
        <Link
          href="/simulados"
          className="block w-full text-center py-3 rounded-lg border border-[#2A2E31] text-[#E9E7E0] hover:border-[#C9A227] hover:text-[#C9A227] text-sm font-medium transition mb-3"
        >
          Ver simulados
        </Link>
        <Link
          href="/leaderboard"
          className="block w-full text-center py-3 rounded-lg border border-[#2A2E31] text-[#E9E7E0] hover:border-[#C9A227] hover:text-[#C9A227] text-sm font-medium transition mb-3"
        >
          Ver ranking
        </Link>
        <Link
          href="/evolucao"
          className="block w-full text-center py-3 rounded-lg border border-[#2A2E31] text-[#E9E7E0] hover:border-[#C9A227] hover:text-[#C9A227] text-sm font-medium transition mb-3"
        >
          Ver evolução
        </Link>
        <Link
          href="/registrar"
          className="block w-full text-center py-3 rounded-lg bg-[#C9A227] hover:bg-[#DBAF2C] text-[#1D1503] text-sm font-semibold transition"
        >
          Registrar hoje
        </Link>
      </div>
    </div>
  );
}
