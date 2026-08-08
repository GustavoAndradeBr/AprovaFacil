"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    // O Supabase, ao abrir esse link, cria uma sessão temporária de
    // recuperação automaticamente (via detectSessionInUrl). Só
    // confirmamos que existe sessão antes de liberar o formulário.
    async function checar() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setErro(
          "Esse link expirou ou já foi usado. Peça um novo em 'Esqueci minha senha'.",
        );
      }
      setPronto(true);
    }
    checar();
  }, []);

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setErro("As senhas não são iguais.");
      return;
    }

    setSalvando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setSalvando(false);

    if (error) {
      setErro("Não deu pra salvar a senha nova. Tenta pedir o link de novo.");
    } else {
      setSucesso(true);
      setTimeout(() => router.push("/"), 1800);
    }
  }

  if (!pronto) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center">
        <p className="text-[#8A8360] text-sm animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-6">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8A8360] font-medium mb-1">
            Nova senha
          </p>
          <h1 className="font-serif text-[22px] text-[#1B1F1D] mb-4">
            Criar senha nova
          </h1>

          {sucesso ? (
            <p className="text-[13px] text-[#2F4A3D]">
              Senha atualizada! Te levando pra Home...
            </p>
          ) : (
            <form onSubmit={salvar} className="space-y-3">
              <div>
                <label className="block text-[12px] text-[#6B6B63] mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#6B6B63] mb-1">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
                />
              </div>

              {erro && <p className="text-[12px] text-[#C4644B]">{erro}</p>}

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 rounded-lg bg-[#1B1F1D] hover:bg-[#2F4A3D] text-white text-sm font-medium transition disabled:opacity-50"
              >
                {salvando ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
