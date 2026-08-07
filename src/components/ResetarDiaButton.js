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

    // Apaga a linha do dia (em vez de zerar), assim ele volta a ficar
    // como "sem registro" — igual a um dia que nunca foi mexido.
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
      <div className="flex flex-col items-center gap-1.5 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="text-[#6B6B63]">
            Apagar registro de hoje (horas, questões e TAF)?
          </span>
          <button
            onClick={resetar}
            disabled={resetando}
            className="text-[#B3462C] font-medium hover:underline disabled:opacity-50"
          >
            {resetando ? "Apagando..." : "Confirmar"}
          </button>
          <button
            onClick={() => {
              setConfirmando(false);
              setErro("");
            }}
            disabled={resetando}
            className="text-[#6B6B63] hover:underline disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
        {erro && <span className="text-[#B3462C]">{erro}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="text-[12px] text-[#6B6B63] hover:text-[#B3462C] transition"
    >
      Resetar hoje
    </button>
  );
}
