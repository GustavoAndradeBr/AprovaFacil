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
        stroke="white"
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
        stroke="#C4644B"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M6 6L18 18"
        stroke="#C4644B"
        strokeWidth="3"
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
    supabase.from("profiles").select("nome").eq("id", user.id).single(),
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
    <div className="min-h-screen bg-[#F7F6F2] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#8A8360] font-medium mb-1">
              {config?.nome_concurso || "Concurso"}
            </p>
            <h1 className="font-serif text-[26px] text-[#1B1F1D]">
              Olá, {profile?.nome?.split(" ")[0] || "candidato"}
            </h1>
          </div>
          <LogoutButton />
        </div>

        {/* Dias restantes + progresso do edital */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
            <p className="text-[12px] text-[#6B6B63] mb-1">Faltam</p>
            <p className="font-serif text-[32px] text-[#1B1F1D] leading-none">
              {diasRestantes ?? "–"}
            </p>
            <p className="text-[12px] text-[#6B6B63] mt-1">dias para a prova</p>
          </div>

          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
            <p className="text-[12px] text-[#6B6B63] mb-1">Edital</p>
            <p className="font-serif text-[32px] text-[#1B1F1D] leading-none">
              {percentEdital}%
            </p>
            <div className="w-full h-1.5 bg-[#EDEBE5] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#2F4A3D] rounded-full"
                style={{ width: `${percentEdital}%` }}
              />
            </div>
          </div>
        </div>

        {/* Resumo do dia */}
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-[#1B1F1D]">Hoje</p>
            {diaHoje?.concluido && (
              <span className="text-[11px] font-medium text-[#2F4A3D] bg-[#EAF0EC] px-2 py-0.5 rounded-full">
                Dia concluído
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="font-serif text-[22px] text-[#1B1F1D]">
                {diaHoje?.horas_estudadas ?? 0}h
              </p>
              <p className="text-[11px] text-[#6B6B63]">estudadas</p>
            </div>
            <div>
              <p className="font-serif text-[22px] text-[#1B1F1D]">
                {diaHoje?.questoes_resolvidas ?? 0}
              </p>
              <p className="text-[11px] text-[#6B6B63]">questões</p>
            </div>
          </div>
        </div>

        {/* Calendário do mês */}
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-[#1B1F1D]">Este mês</p>
            <div className="flex items-center gap-3 text-[10px] text-[#8A8360]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2F4A3D] inline-block" />
                feito
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#F7E8E4] border border-[#E7C9C0] inline-block" />
                sem registro
              </span>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {celulas.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square" />;

              const passou = c.data <= hoje; // já viveu esse dia (inclui hoje)
              const feito = c.status === true;
              const naoFeito = passou && !feito;

              return (
                <div
                  key={i}
                  title={c.data}
                  className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium transition-colors
                    ${
                      feito
                        ? "bg-[#2F4A3D] text-white"
                        : naoFeito
                          ? "bg-[#F7E8E4] text-[#C4644B]"
                          : "bg-[#F2F1EC] text-[#8A8360]"
                    }
                    ${c.hoje ? "ring-2 ring-[#8A8360]" : ""}
                  `}
                >
                  {feito ? <CheckIcon /> : naoFeito ? <XIcon /> : c.dia}
                </div>
              );
            })}
          </div>
        </div>
        <Link
          href="/planejamento"
          className="block w-full text-center py-3 rounded-lg border border-[#2F4A3D] text-[#2F4A3D] hover:bg-[#EAF0EC] text-sm font-medium transition mb-3"
        >
          Ver planejamento da semana
        </Link>
        <Link
          href="/simulados"
          className="block w-full text-center py-3 rounded-lg border border-[#2F4A3D] text-[#2F4A3D] hover:bg-[#EAF0EC] text-sm font-medium transition mb-3"
        >
          Ver simulados
        </Link>
        <Link
          href="/registrar"
          className="block w-full text-center py-3 rounded-lg bg-[#1B1F1D] hover:bg-[#2F4A3D] text-white text-sm font-medium transition"
        >
          Registrar hoje
        </Link>
      </div>
    </div>
  );
}
