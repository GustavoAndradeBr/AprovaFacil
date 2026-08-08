"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setErro("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setEnviando(false);

    if (error) {
      setErro("Não deu pra enviar o email. Confere se digitou certo.");
    } else {
      setEnviado(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-[#E4E1DA] p-6">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8A8360] font-medium mb-1">
            Recuperar acesso
          </p>
          <h1 className="font-serif text-[22px] text-[#1B1F1D] mb-4">
            Esqueci minha senha
          </h1>

          {enviado ? (
            <div>
              <p className="text-[13px] text-[#4A4A45] mb-4">
                Se esse email estiver cadastrado, você vai receber um link pra
                criar uma senha nova. Confere sua caixa de entrada (e o spam,
                por garantia).
              </p>
              <Link
                href="/login"
                className="block w-full text-center py-2.5 rounded-lg border border-[#2F4A3D] text-[#2F4A3D] hover:bg-[#EAF0EC] text-sm font-medium transition"
              >
                Voltar pro login
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-3">
              <div>
                <label className="block text-[12px] text-[#6B6B63] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAFAF8] border border-[#D0CBC2] text-sm text-[#2F2F2F] placeholder:text-[#6B6B63] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
                />
              </div>

              {erro && <p className="text-[12px] text-[#C4644B]">{erro}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="w-full py-2.5 rounded-lg bg-[#1B1F1D] hover:bg-[#2F4A3D] text-white text-sm font-medium transition disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar link de recuperação"}
              </button>

              <Link
                href="/login"
                className="block text-center text-[12px] text-[#6B6B63] hover:text-[#1B1F1D] transition pt-1"
              >
                Voltar pro login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
