"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeLocalStr } from "@/lib/date";

export default function ResetarDiaButton({ userId, onReset }) {
  const supabase = createClient();
  const [confirmando, setConfirmando] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [erro, setErro] = useState("");

  async function resetar() {
    if (!userId) {
      setErro("Usuário ainda não carregou, tenta de novo em 1s.");
      return;
    }

    setResetando(true);
    setErro("");
    const hoje = hojeLocalStr();

    const { error: erroDia } = await supabase
      .from("dias")
      .delete()
      .eq("user_id", userId)
      .eq("data", hoje);

    const { error: erroTaf } = await supabase
      .from("taf_registros")
      .delete()
      .eq("user_id", userId)
      .eq("data", hoje);

    setResetando(false);

    if (erroDia || erroTaf) {
      setErro("Não deu pra resetar. Tenta de novo.");
      return;
    }

    setConfirmando(false);
    onReset?.();
  }

  if (confirmando) {
    return (
      <div className="flex flex-col items-end gap-1.5 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-[#8B9296]">Apagar registro de hoje?</span>
          <button
            onClick={resetar}
            disabled={resetando}
            className="text-[#E2534A] font-medium hover:underline disabled:opacity-50"
          >
            {resetando ? "Apagando..." : "Confirmar"}
          </button>
          <button
            onClick={() => {
              setConfirmando(false);
              setErro("");
            }}
            disabled={resetando}
            className="text-[#8B9296] hover:underline disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
        {erro && <span className="text-[#E2534A]">{erro}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-[12px] text-[#8B9296] hover:text-[#E2534A] transition"
    >
      Resetar hoje
    </button>
  );
}
