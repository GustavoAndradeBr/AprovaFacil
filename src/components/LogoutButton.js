"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const supabase = createClient();
  const router = useRouter();

  async function sair() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={sair}
      className="text-[12px] text-[#6B6B63] hover:text-[#B3462C] transition cursor-pointer"
    >
      Sair
    </button>
  );
}
