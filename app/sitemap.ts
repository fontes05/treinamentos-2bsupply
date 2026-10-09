import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = "https://absuprimentos.com.br";

  const paginas = [
    "/",
    "/cursos",
    "/sobre",
    "/contato",
    "/certificacoes",
    "/cursos/curso-inteligencia-artificial-compras",
    "/cursos/curso-gestao-de-contratos-suprimentos",
    "/cursos/curso-tributacao-para-compradores",
    "/cursos/curso-negociacao-para-compradores",
    "/cursos/curso-almoxarifado-com-ia",
    "/cursos/treinamento-estrategico-para-compradores",
  ];

  return paginas.map((pagina) => ({
    url: `${siteUrl}${pagina}`,
  }));
}