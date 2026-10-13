import type { Metadata } from "next";

import CursosClient, {
  type Treinamento,
} from "./CursosClient";

import { createPublicServerClient } from "@/lib/supabase/public-server";

export const revalidate = 300;

export const metadata: Metadata = {
  title: {
    absolute: "Cursos Online de Compras e Suprimentos | 2BSUPPLY",
  },
  description:
    "Encontre cursos online de Compras, Suprimentos, Strategic Sourcing, negociação, contratos, tributação e inteligência artificial aplicada.",
  alternates: {
    canonical: "https://absuprimentos.com.br/cursos",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://absuprimentos.com.br/cursos",
    siteName: "Academia Brasileira de Suprimentos",
    title: "Cursos Online de Compras e Suprimentos | 2BSUPPLY",
    description:
      "Cursos online para desenvolver competências em Compras, Suprimentos e Supply Chain.",
  },
};

export default async function CursosPage() {
  const supabase = createPublicServerClient();

  const { data, error } = await supabase
    .from("treinamentos_cursos")
    .select(`
      id,
      titulo,
      slug,
      descricao,
      imagem_url,
      destaque,
      nome_botao_curso,
      linha_destaque_card,
      voce_vai_aprender,
      ordem_cursos
    `)
    .eq("status", "publicado")
    .order("ordem_cursos", { ascending: true })
    .order("titulo", { ascending: true });

  if (error) {
    console.error(
      "Erro ao carregar treinamentos:",
      error,
    );

    return (
      <CursosClient
        treinamentos={[]}
        erroInicial="Não foi possível carregar os treinamentos."
      />
    );
  }

  return (
    <CursosClient
      treinamentos={(data ?? []) as Treinamento[]}
    />
  );
}
