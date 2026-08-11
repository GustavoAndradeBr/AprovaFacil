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
      <div className="min-h-screen bg-[#14171A] flex items-center justify-center">
        <p className="text-[#8B9296] text-sm animate-pulse">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#14171A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-6">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8B9296] font-medium mb-1">
            Nova senha
          </p>
          <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[20px] text-[#E9E7E0] mb-4">
            Criar senha nova
          </h1>

          {sucesso ? (
            <p className="text-[13px] text-[#7A9770]">
              Senha atualizada! Te levando pra Home...
            </p>
          ) : (
            <form onSubmit={salvar} className="space-y-3">
              <div>
                <label className="block text-[12px] text-[#8B9296] mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
                />
              </div>
              <div>
                <label className="block text-[12px] text-[#8B9296] mb-1">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
                />
              </div>

              {erro && <p className="text-[12px] text-[#E2534A]">{erro}</p>}

              <button
                type="submit"
                disabled={salvando}
                className="w-full py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#DBAF2C] text-[#1D1503] text-sm font-semibold transition disabled:opacity-50"
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
