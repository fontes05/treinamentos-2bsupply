import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://seudominio.com.br";

  const paginas = [
    "/",
    "/cursos",
    "/sobre",
    "/contato",
    "/certificacoes",
  ];

  return paginas.map((pagina) => ({
    url: `${siteUrl}${pagina}`,
  }));
}