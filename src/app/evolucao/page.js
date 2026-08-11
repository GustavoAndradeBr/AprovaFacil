"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LARGURA = 600;
const ALTURA = 200;
const PADDING = 28;

function formatarDataCurta(dataStr) {
  const [, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}`;
}

function construirGrafico(pontos) {
  if (pontos.length === 0) return null;

  const valores = pontos.map((p) => p.valor);
  const min = Math.min(...valores, 0);
  const max = Math.max(...valores, 1);
  const range = max - min || 1;

  const passoX =
    pontos.length > 1 ? (LARGURA - PADDING * 2) / (pontos.length - 1) : 0;

  const coords = pontos.map((p, i) => {
    const x = pontos.length > 1 ? PADDING + i * passoX : LARGURA / 2;
    const y =
      ALTURA - PADDING - ((p.valor - min) / range) * (ALTURA - PADDING * 2);
    return { x, y, ...p };
  });

  const linha = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const area =
    coords.length > 1
      ? `${linha} L ${coords[coords.length - 1].x.toFixed(1)} ${ALTURA - PADDING} L ${coords[0].x.toFixed(1)} ${ALTURA - PADDING} Z`
      : "";

  return { coords, linha, area, min, max };
}

function GraficoLinha({ pontos, sufixo = "", cor = "#C9A227" }) {
  const grafico = construirGrafico(pontos);

  if (!grafico || pontos.length < 2) {
    return (
      <p className="text-[13px] text-[#8B9296] py-8 text-center">
        Ainda não tem dados suficientes pra montar o gráfico (precisa de pelo
        menos 2 registros).
      </p>
    );
  }

  const { coords, linha, area } = grafico;
  const passoLabel = Math.max(1, Math.ceil(coords.length / 6));

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA + 20}`}
      className="w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      {[0, 0.5, 1].map((frac) => (
        <line
          key={frac}
          x1={PADDING}
          x2={LARGURA - PADDING}
          y1={PADDING + frac * (ALTURA - PADDING * 2)}
          y2={PADDING + frac * (ALTURA - PADDING * 2)}
          stroke="#2A2E31"
          strokeWidth="1"
        />
      ))}

      <path d={area} fill={cor} fillOpacity="0.12" />
      <path d={linha} fill="none" stroke={cor} strokeWidth="2.5" />

      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r="3.5" fill={cor} />
          {i % passoLabel === 0 && (
            <text
              x={c.x}
              y={ALTURA + 14}
              fontSize="10"
              textAnchor="middle"
              fill="#8B9296"
            >
              {formatarDataCurta(c.data)}
            </text>
          )}
        </g>
      ))}

      <text
        x={coords[coords.length - 1].x}
        y={coords[coords.length - 1].y - 10}
        fontSize="12"
        fontWeight="600"
        textAnchor="middle"
        fill={cor}
      >
        {coords[coords.length - 1].valor}
        {sufixo}
      </text>
    </svg>
  );
}

export default function EvolucaoPage() {
  const supabase = createClient();
  const [horasPontos, setHorasPontos] = useState([]);
  const [simuladosPontos, setSimuladosPontos] = useState([]);
  const [resumo, setResumo] = useState({
    mediaHorasSemana: 0,
    melhorSimulado: null,
    ultimoSimulado: null,
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: dias }, { data: simulados }] = await Promise.all([
        supabase
          .from("dias")
          .select("data, horas_estudadas")
          .eq("user_id", user.id)
          .order("data", { ascending: true }),
        supabase
          .from("simulados")
          .select("data, percentual")
          .eq("user_id", user.id)
          .not("percentual", "is", null)
          .order("data", { ascending: true }),
      ]);

      const ultimosDias = (dias || []).slice(-20);
      const horas = ultimosDias.map((d) => ({
        data: d.data,
        valor: d.horas_estudadas || 0,
      }));
      setHorasPontos(horas);

      const ultimosSimulados = (simulados || []).slice(-20);
      const sims = ultimosSimulados.map((s) => ({
        data: s.data,
        valor: s.percentual,
      }));
      setSimuladosPontos(sims);

      const ultimosSete = (dias || []).slice(-7);
      const mediaHoras =
        ultimosSete.length > 0
          ? ultimosSete.reduce(
              (soma, d) => soma + (d.horas_estudadas || 0),
              0,
            ) / ultimosSete.length
          : 0;

      const melhor =
        simulados && simulados.length > 0
          ? Math.max(...simulados.map((s) => s.percentual))
          : null;

      const ultimo =
        simulados && simulados.length > 0
          ? simulados[simulados.length - 1].percentual
          : null;

      setResumo({
        mediaHorasSemana: Math.round(mediaHoras * 10) / 10,
        melhorSimulado: melhor,
        ultimoSimulado: ultimo,
      });

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
              Sua trajetória
            </p>
            <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[22px] text-[#E9E7E0]">
              Evolução
            </h1>
          </div>
          <a
            href="/"
            className="text-[13px] text-[#8B9296] hover:text-[#E9E7E0] transition"
          >
            ← Home
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-4">
            <p className="text-[11px] text-[#8B9296] mb-1">Média/dia (7d)</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[19px] text-[#E9E7E0] leading-none">
              {resumo.mediaHorasSemana}h
            </p>
          </div>
          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-4">
            <p className="text-[11px] text-[#8B9296] mb-1">Último simulado</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[19px] text-[#E9E7E0] leading-none">
              {resumo.ultimoSimulado != null
                ? `${resumo.ultimoSimulado}%`
                : "–"}
            </p>
          </div>
          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-4">
            <p className="text-[11px] text-[#8B9296] mb-1">Melhor simulado</p>
            <p className="font-[family-name:var(--font-geist-mono)] text-[19px] text-[#E9E7E0] leading-none">
              {resumo.melhorSimulado != null
                ? `${resumo.melhorSimulado}%`
                : "–"}
            </p>
          </div>
        </div>

        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
          <p className="text-[13px] font-medium text-[#E9E7E0] mb-3">
            Horas estudadas (últimos registros)
          </p>
          <GraficoLinha pontos={horasPontos} sufixo="h" cor="#C9A227" />
        </div>

        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5 mb-4">
          <p className="text-[13px] font-medium text-[#E9E7E0] mb-3">
            % de acertos nos simulados
          </p>
          <GraficoLinha pontos={simuladosPontos} sufixo="%" cor="#7A9770" />
        </div>
      </div>
    </div>
  );
}
