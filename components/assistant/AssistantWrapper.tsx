"use client";

import { usePathname } from "next/navigation";

import FloatingAssistant from "./FloatingAssistant";

export default function AssistantWrapper() {
  const pathname = usePathname();

  /*
   * Não exibe o robô
   * dentro do painel administrativo.
   */
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return <FloatingAssistant />;
}