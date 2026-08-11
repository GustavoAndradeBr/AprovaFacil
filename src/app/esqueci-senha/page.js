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
    <div className="min-h-screen bg-[#14171A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#1D2124] rounded-lg border border-[#2A2E31] p-6">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8B9296] font-medium mb-1">
            Recuperar acesso
          </p>
          <h1 className="font-[family-name:var(--font-oswald)] font-medium text-[20px] text-[#E9E7E0] mb-4">
            Esqueci minha senha
          </h1>

          {enviado ? (
            <div>
              <p className="text-[13px] text-[#B8B5AC] mb-4">
                Se esse email estiver cadastrado, você vai receber um link pra
                criar uma senha nova. Confere sua caixa de entrada (e o spam,
                por garantia).
              </p>
              <Link
                href="/login"
                className="block w-full text-center py-2.5 rounded-lg border border-[#2A2E31] text-[#E9E7E0] hover:border-[#C9A227] hover:text-[#C9A227] text-sm font-medium transition"
              >
                Voltar pro login
              </Link>
            </div>
          ) : (
            <form onSubmit={enviar} className="space-y-3">
              <div>
                <label className="block text-[12px] text-[#8B9296] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 rounded-lg bg-[#14171A] border border-[#2A2E31] text-sm text-[#E9E7E0] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
                />
              </div>

              {erro && <p className="text-[12px] text-[#E2534A]">{erro}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="w-full py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#DBAF2C] text-[#1D1503] text-sm font-semibold transition disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar link de recuperação"}
              </button>

              <Link
                href="/login"
                className="block text-center text-[12px] text-[#8B9296] hover:text-[#E9E7E0] transition pt-1"
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
