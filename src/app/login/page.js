"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha incorretos.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F6F2] px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#8A8360] font-medium mb-3">
            Acesso restrito
          </p>
          <h1 className="font-serif text-[28px] text-[#1B1F1D] leading-tight">
            Estudos GCM Limeira
          </h1>
          <p className="text-[#6B6B63] text-sm mt-1">
            Concurso Público 07/2026
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-xl border border-[#E4E1DA] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_rgba(27,31,29,0.06)] overflow-hidden"
        >
          <div className="h-[3px] bg-[#2F4A3D]" />

          <div className="p-8">
            <label className="block text-[13px] font-medium text-[#1B1F1D] mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@gmail.com"
              className="w-full mb-5 px-3.5 py-2.5 rounded-lg bg-[#FAFAF8] text-[#1B1F1D] text-sm border border-[#E4E1DA] placeholder:text-[#A8A69D] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
            />

            <label className="block text-[13px] font-medium text-[#1B1F1D] mb-1.5">
              Senha
            </label>
            <div className="relative mb-2">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-11 rounded-lg bg-[#FAFAF8] text-[#1B1F1D] text-sm border border-[#E4E1DA] placeholder:text-[#A8A69D] focus:outline-none focus:border-[#2F4A3D] focus:ring-1 focus:ring-[#2F4A3D] transition"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-0 top-0 h-full px-3 flex items-center text-[#8A8360] hover:text-[#2F4A3D] transition"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5.05 0-9.29-3.14-11-8 1.13-3.16 3.31-5.68 6.12-7.06M9.9 4.24A10.94 10.94 0 0 1 12 4c5.05 0 9.29 3.14 11 8-.61 1.72-1.6 3.24-2.87 4.47M1 1l22 22"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {erro && (
              <p className="text-[#B3462C] text-[13px] mt-2 mb-1">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-5 py-2.5 rounded-lg bg-[#1B1F1D] hover:bg-[#2F4A3D] text-white text-sm font-medium transition disabled:opacity-50"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>

        <p className="text-center text-[12px] text-[#A8A69D] mt-6">
          Ferramenta de preparação · uso restrito a 5 pessoas <br /> Gustavo
          Andrade
        </p>
      </div>
    </div>
  );
}
