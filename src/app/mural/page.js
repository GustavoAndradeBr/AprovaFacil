"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const EMOJIS = ["👍", "🔥", "💪"];

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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

function tempoRelativo(dataStr) {
  const agora = new Date();
  const data = new Date(dataStr);
  const diffMs = agora - data;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

function Avatar({ perfil }) {
  return (
    <div className="w-8 h-8 rounded-full bg-[#14171A] border border-[#2A2E31] flex items-center justify-center overflow-hidden shrink-0">
      {perfil?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={perfil.avatar_url}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <UserIcon />
      )}
    </div>
  );
}

export default function MuralPage() {
  const supabase = createClient();
  const [userId, setUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [posts, setPosts] = useState([]);
  const [comentarios, setComentarios] = useState({});
  const [reacoes, setReacoes] = useState({});
  const [perfis, setPerfis] = useState({});
  const [novoConteudo, setNovoConteudo] = useState("");
  const [novoLink, setNovoLink] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [comentarioTexto, setComentarioTexto] = useState({});
  const [carregando, setCarregando] = useState(true);

  async function carregarTudo(uid) {
    const [
      { data: postsData },
      { data: comentariosData },
      { data: reacoesData },
    ] = await Promise.all([
      supabase
        .from("mural_posts")
        .select("*")
        .order("criado_em", { ascending: false }),
      supabase
        .from("mural_comentarios")
        .select("*")
        .order("criado_em", { ascending: true }),
      supabase.from("mural_reacoes").select("*"),
    ]);

    setPosts(postsData || []);

    const comentariosPorPost = {};
    (comentariosData || []).forEach((c) => {
      if (!comentariosPorPost[c.post_id]) comentariosPorPost[c.post_id] = [];
      comentariosPorPost[c.post_id].push(c);
    });
    setComentarios(comentariosPorPost);

    const reacoesPorPost = {};
    (reacoesData || []).forEach((r) => {
      if (!reacoesPorPost[r.post_id]) reacoesPorPost[r.post_id] = [];
      reacoesPorPost[r.post_id].push(r);
    });
    setReacoes(reacoesPorPost);

    // Busca os perfis de todo mundo que postou ou comentou
    const idsUnicos = new Set();
    (postsData || []).forEach((p) => idsUnicos.add(p.autor_id));
    (comentariosData || []).forEach((c) => idsUnicos.add(c.autor_id));

    if (idsUnicos.size > 0) {
      const { data: perfisData } = await supabase
        .from("profiles")
        .select("id, nome, avatar_url")
        .in("id", Array.from(idsUnicos));

      const perfisMap = {};
      (perfisData || []).forEach((p) => {
        perfisMap[p.id] = p;
      });
      setPerfis(perfisMap);
    }
  }

  useEffect(() => {
    async function iniciar() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: meuPerfil } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      setIsAdmin(!!meuPerfil?.is_admin);

      await carregarTudo(user.id);
      setCarregando(false);
    }
    iniciar();
  }, []);

  async function publicar(e) {
    e.preventDefault();
    if (!novoConteudo.trim()) return;
    setPublicando(true);

    await supabase.from("mural_posts").insert({
      autor_id: userId,
      conteudo: novoConteudo.trim(),
      link: novoLink.trim() || null,
    });

    setNovoConteudo("");
    setNovoLink("");
    setPublicando(false);
    await carregarTudo(userId);
  }

  async function comentar(postId) {
    const texto = (comentarioTexto[postId] || "").trim();
    if (!texto) return;

    setComentarioTexto((prev) => ({ ...prev, [postId]: "" }));

    await supabase.from("mural_comentarios").insert({
      post_id: postId,
      autor_id: userId,
      conteudo: texto,
    });

    await carregarTudo(userId);
  }

  async function alternarReacao(postId, emoji) {
    const reacoesDoPost = reacoes[postId] || [];
    const jaReagiu = reacoesDoPost.find(
      (r) => r.autor_id === userId && r.emoji === emoji,
    );

    if (jaReagiu) {
      await supabase.from("mural_reacoes").delete().eq("id", jaReagiu.id);
    } else {
      await supabase
        .from("mural_reacoes")
        .insert({ post_id: postId, autor_id: userId, emoji });
    }

    await carregarTudo(userId);
  }

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
              Central
            </p>
            <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[22px] text-[#E9E7E0]">
              Mural
            </h1>
          </div>
          <a
            href="/"
            className="text-[13px] text-[#8B9296] hover:text-[#E9E7E0] transition"
          >
            ← Home
          </a>
        </div>

        {isAdmin && (
          <form
            onSubmit={publicar}
            className="bg-[#1D2124] rounded-lg border border-[#5C4A1A] p-5 mb-4"
          >
            <p className="text-[13px] font-medium text-[#DBAF2C] mb-3">
              Publicar aviso
            </p>
            <textarea
              rows={3}
              value={novoConteudo}
              onChange={(e) => setNovoConteudo(e.target.value)}
              placeholder="Escreve o aviso pro grupo..."
              className="w-full mb-2 px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition resize-none"
            />
            <input
              type="url"
              value={novoLink}
              onChange={(e) => setNovoLink(e.target.value)}
              placeholder="Link (opcional)"
              className="w-full mb-3 px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
            />
            <button
              type="submit"
              disabled={publicando || !novoConteudo.trim()}
              className="w-full py-2 rounded-lg bg-[#C9A227] hover:bg-[#DBAF2C] text-[#1D1503] text-sm font-semibold transition disabled:opacity-50"
            >
              {publicando ? "Publicando..." : "Publicar"}
            </button>
          </form>
        )}

        {posts.length === 0 ? (
          <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-5">
            <p className="text-[13px] text-[#8B9296]">
              Nenhum aviso publicado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const autor = perfis[post.autor_id];
              const reacoesDoPost = reacoes[post.id] || [];
              const comentariosDoPost = comentarios[post.id] || [];

              return (
                <div
                  key={post.id}
                  className="bg-[#1D2124] rounded-lg border border-[#2A2E31] overflow-hidden"
                >
                  <div className="h-[2px] bg-[#C9A227]" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Avatar perfil={autor} />
                      <div>
                        <p className="text-[13px] font-medium text-[#E9E7E0]">
                          {autor?.nome || "Admin"}
                        </p>
                        <p className="text-[11px] text-[#8B9296]">
                          {tempoRelativo(post.criado_em)}
                        </p>
                      </div>
                    </div>

                    <p className="text-[14px] text-[#E9E7E0] whitespace-pre-wrap mb-2">
                      {post.conteudo}
                    </p>

                    {post.link && (
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-[13px] text-[#C9A227] hover:text-[#DBAF2C] underline underline-offset-2 mb-3 break-all"
                      >
                        {post.link}
                      </a>
                    )}

                    {/* Reações */}
                    <div className="flex items-center gap-2 mt-3 mb-3">
                      {EMOJIS.map((emoji) => {
                        const contagem = reacoesDoPost.filter(
                          (r) => r.emoji === emoji,
                        ).length;
                        const euReagi = reacoesDoPost.some(
                          (r) => r.autor_id === userId && r.emoji === emoji,
                        );
                        return (
                          <button
                            key={emoji}
                            onClick={() => alternarReacao(post.id, emoji)}
                            className={`text-[13px] px-2.5 py-1 rounded-full border transition ${
                              euReagi
                                ? "border-[#C9A227] bg-[#1F1B0D]"
                                : "border-[#2A2E31] hover:border-[#5C6165]"
                            }`}
                          >
                            {emoji}{" "}
                            {contagem > 0 && (
                              <span className="text-[#8B9296] font-[family-name:var(--font-geist-mono)]">
                                {contagem}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Comentários */}
                    {comentariosDoPost.length > 0 && (
                      <div className="space-y-2.5 pt-3 border-t border-[#2A2E31]">
                        {comentariosDoPost.map((c) => {
                          const autorComentario = perfis[c.autor_id];
                          return (
                            <div key={c.id} className="flex gap-2.5">
                              <Avatar perfil={autorComentario} />
                              <div>
                                <p className="text-[12px]">
                                  <span className="font-medium text-[#E9E7E0]">
                                    {autorComentario?.nome || "Alguém"}
                                  </span>{" "}
                                  <span className="text-[#8B9296]">
                                    {tempoRelativo(c.criado_em)}
                                  </span>
                                </p>
                                <p className="text-[13px] text-[#B8B5AC]">
                                  {c.conteudo}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Novo comentário */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#2A2E31]">
                      <input
                        type="text"
                        value={comentarioTexto[post.id] || ""}
                        onChange={(e) =>
                          setComentarioTexto((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") comentar(post.id);
                        }}
                        placeholder="Comentar..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#14171A] border border-[#2A2E31] text-[13px] text-[#E9E7E0] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
                      />
                      <button
                        onClick={() => comentar(post.id)}
                        className="text-[12px] font-medium text-[#C9A227] hover:text-[#DBAF2C] transition shrink-0"
                      >
                        Enviar
                      </button>
                    </div>
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
