"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeLocalStr } from "@/lib/date";

function calcularStreak(datasConcluidas, hoje) {
  const set = new Set(datasConcluidas);
  let streak = 0;
  const cursor = new Date(hoje + "T00:00:00");

  // se hoje ainda não foi concluído, começa a contar a partir de ontem
  // (assim o streak não "quebra" só porque o dia ainda não acabou)
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

export default function PerfilPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState({
    streak: 0,
    horasTotais: 0,
    percentEdital: 0,
    melhorSimulado: null,
  });
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    cidade: "",
    cargo_pretendido: "",
    bio: "",
    avatar_url: "",
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState("");

  useEffect(() => {
    async function carregar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email || "");

      const hoje = hojeLocalStr();

      const [
        { data: perfilData },
        { data: assuntos },
        { data: progresso },
        { data: diasConcluidos },
        { data: dias },
        { data: simulados },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("assuntos").select("id"),
        supabase
          .from("assunto_progresso")
          .select(
            "aula_concluida, resumo_feito, questoes_concluidas, revisao_realizada",
          )
          .eq("user_id", user.id),
        supabase
          .from("dias")
          .select("data")
          .eq("user_id", user.id)
          .eq("concluido", true),
        supabase.from("dias").select("horas_estudadas").eq("user_id", user.id),
        supabase
          .from("simulados")
          .select("percentual")
          .eq("user_id", user.id)
          .not("percentual", "is", null)
          .order("percentual", { ascending: false })
          .limit(1),
      ]);

      setPerfil(perfilData);
      setForm({
        nome: perfilData?.nome || "",
        cidade: perfilData?.cidade || "",
        cargo_pretendido: perfilData?.cargo_pretendido || "",
        bio: perfilData?.bio || "",
        avatar_url: perfilData?.avatar_url || "",
      });

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

      setStats({
        streak,
        horasTotais,
        percentEdital,
        melhorSimulado: simulados?.[0]?.percentual ?? null,
      });

      setCarregando(false);
    }
    carregar();
  }, []);

  async function salvarPerfil(e) {
    e.preventDefault();
    setSalvando(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nome: form.nome,
        cidade: form.cidade,
        cargo_pretendido: form.cargo_pretendido,
        bio: form.bio,
        avatar_url: form.avatar_url,
      })
      .eq("id", userId);

    setSalvando(false);

    if (!error) {
      setPerfil((prev) => ({ ...prev, ...form }));
      setEditando(false);
      setSalvo("Perfil atualizado");
      setTimeout(() => setSalvo(""), 1500);
    }
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
              Seu perfil
            </p>
            <h1 className="font-serif text-[24px] text-[#1B1F1D]">
              {perfil?.nome || "Candidato"}
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

        {/* Card principal */}
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-5 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-[#F2F1EC] flex items-center justify-center overflow-hidden shrink-0">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[20px] text-[#1B1F1D] truncate">
                {perfil?.nome || "Candidato"}
              </p>
              <p className="text-[12px] text-[#6B6B63] truncate">{email}</p>
              {perfil?.cargo_pretendido && (
                <p className="text-[12px] text-[#8A8360] mt-0.5">
                  {perfil.cargo_pretendido}
                  {perfil?.cidade ? ` · ${perfil.cidade}` : ""}
                </p>
              )}
            </div>
          </div>

          {perfil?.bio && (
            <p className="text-[13px] text-[#4A4A45] mb-4">{perfil.bio}</p>
          )}

          {!editando ? (
            <button
              onClick={() => setEditando(true)}
              className="text-[12px] text-[#6B6B63] hover:text-[#1B1F1D] transition"
            >
              Editar perfil
            </button>
          ) : (
            <form onSubmit={salvarPerfil} className="space-y-3 mt-2">
              <div>
                <label className="block text-[12px] text-[#6B6B63] mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6B6B63] mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) =>
                      setForm({ ...form, cidade: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-[#6B6B63] mb-1">
                    Cargo pretendido
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: GCM 3ª Classe"
                    value={form.cargo_pretendido}
                    onChange={(e) =>
                      setForm({ ...form, cargo_pretendido: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] text-[#6B6B63] mb-1">
                  Link do avatar (URL de uma imagem)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.avatar_url}
                  onChange={(e) =>
                    setForm({ ...form, avatar_url: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#6B6B63] mb-1">
                  Bio curta
                </label>
                <textarea
                  rows={2}
                  maxLength={140}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2 rounded-lg bg-[#1B1F1D] hover:bg-[#2F4A3D] text-white text-sm font-medium transition disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditando(false);
                    setForm({
                      nome: perfil?.nome || "",
                      cidade: perfil?.cidade || "",
                      cargo_pretendido: perfil?.cargo_pretendido || "",
                      bio: perfil?.bio || "",
                      avatar_url: perfil?.avatar_url || "",
                    });
                  }}
                  className="px-4 py-2 rounded-lg border border-[#D0CBC2] text-[#6B6B63] text-sm font-medium hover:bg-[#F2F1EC] transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
            <p className="text-[12px] text-[#6B6B63] mb-1">Sequência atual</p>
            <p className="font-serif text-[28px] text-[#1B1F1D] leading-none">
              {stats.streak} 🔥
            </p>
            <p className="text-[11px] text-[#6B6B63] mt-1">
              {stats.streak === 1 ? "dia seguido" : "dias seguidos"}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
            <p className="text-[12px] text-[#6B6B63] mb-1">Horas totais</p>
            <p className="font-serif text-[28px] text-[#1B1F1D] leading-none">
              {stats.horasTotais}h
            </p>
            <p className="text-[11px] text-[#6B6B63] mt-1">estudadas</p>
          </div>

          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
            <p className="text-[12px] text-[#6B6B63] mb-1">Edital</p>
            <p className="font-serif text-[28px] text-[#1B1F1D] leading-none">
              {stats.percentEdital}%
            </p>
            <div className="w-full h-1.5 bg-[#EDEBE5] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-[#2F4A3D] rounded-full"
                style={{ width: `${stats.percentEdital}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E4E1DA] p-5">
            <p className="text-[12px] text-[#6B6B63] mb-1">Melhor simulado</p>
            <p className="font-serif text-[28px] text-[#1B1F1D] leading-none">
              {stats.melhorSimulado != null ? `${stats.melhorSimulado}%` : "–"}
            </p>
            <p className="text-[11px] text-[#6B6B63] mt-1">de acertos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
