"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#14171A]">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D0E]/80 via-[#14171A]/85 to-[#0B0D0E]/95" />

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, #E9E7E0 0px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative w-full max-w-[380px]">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 rounded-xl bg-[#1D2124] border border-[#C9A227] flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2 L20 5.5 V11 C20 16.5 16.5 20.7 12 22 C7.5 20.7 4 16.5 4 11 V5.5 Z"
                fill="#2F4A3D"
                stroke="#C9A227"
                strokeWidth="1"
              />
              <path
                d="M8 12 L11 15 L16 9"
                fill="none"
                stroke="#E9E7E0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-[11px] tracking-[0.25em] uppercase text-[#8B9296] font-medium mb-2">
            Acesso restrito
          </p>
          <h1 className="font-[family-name:var(--font-oswald)] font-semibold uppercase tracking-wide text-[26px] text-[#E9E7E0] leading-tight">
            Estudos GCM Limeira
          </h1>
          <p className="text-[#8B9296] text-sm mt-1">
            Concurso Público 07/2026
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-[#1D2124]/95 backdrop-blur-sm rounded-xl border border-[#2A2E31] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden"
        >
          <div className="h-[3px] bg-[#C9A227]" />

          <div className="p-8">
            <label className="block text-[13px] font-medium text-[#E9E7E0] mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@gmail.com"
              className="w-full mb-5 px-3.5 py-2.5 rounded-lg bg-[#14171A] text-[#E9E7E0] text-sm border border-[#2A2E31] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
            />

            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[13px] font-medium text-[#E9E7E0]">
                Senha
              </label>
              <Link
                href="/esqueci-senha"
                className="text-[12px] text-[#C9A227] hover:text-[#E0B840] transition"
              >
                Esqueci minha senha
              </Link>
            </div>
            <div className="relative mb-2">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-11 rounded-lg bg-[#14171A] text-[#E9E7E0] text-sm border border-[#2A2E31] placeholder:text-[#5C6165] focus:outline-none focus:border-[#C9A227] focus:ring-1 focus:ring-[#C9A227] transition"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-0 top-0 h-full px-3 flex items-center text-[#8B9296] hover:text-[#C9A227] transition"
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
              <p className="text-[#E2534A] text-[13px] mt-2 mb-1">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full mt-5 py-2.5 rounded-lg bg-[#C9A227] hover:bg-[#DBAF2C] text-[#1D1503] text-sm font-semibold transition disabled:opacity-50"
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>

        <p className="text-center text-[12px] text-[#5C6165] mt-6">
          Ferramenta de preparação · uso restrito a 5 pessoas <br /> Gustavo
          Andrade
        </p>
      </div>
    </div>
  );
}
