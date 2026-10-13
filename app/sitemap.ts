import type { MetadataRoute } from "next";

import { createPublicServerClient } from "@/lib/supabase/public-server";

const SITE_URL = "https://absuprimentos.com.br";

type CursoSitemap = {
  slug: string;
  updated_at: string | null;
};

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginasEstaticas: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/cursos`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/certificacoes`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const supabase = createPublicServerClient();

  const { data, error } = await supabase
    .from("treinamentos_cursos")
    .select("slug, updated_at")
    .eq("status", "publicado")
    .order("slug", { ascending: true });

  if (error) {
    console.error(
      "Erro ao carregar cursos para o sitemap:",
      error,
    );

    return paginasEstaticas;
  }

  const cursos = (data ?? []) as CursoSitemap[];

  const paginasCursos: MetadataRoute.Sitemap = cursos.map(
    (curso) => ({
      url: `${SITE_URL}/cursos/${encodeURIComponent(curso.slug)}`,
      ...(curso.updated_at
        ? {
            lastModified: new Date(curso.updated_at),
          }
        : {}),
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  return [
    ...paginasEstaticas,
    ...paginasCursos,
  ];
}
