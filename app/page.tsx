import type { Metadata } from "next";

import HomeClient, {
  type BannerHome,
  type Categoria,
  type Testimonial,
  type TreinamentoHome,
} from "./HomeClient";

import { createPublicServerClient } from "@/lib/supabase/public-server";

const SITE_URL = "https://absuprimentos.com.br";

const FALLBACK_BANNER =
  "/reuniao-estrategica-com-dashboard-global.png";

const SEO_TITLE = "Cursos de Compras e Suprimentos Online | 2BSUPPLY";
const SEO_DESCRIPTION =
  "Cursos online de Compras, Suprimentos e Supply Chain com certificado: IA, negociação, contratos e Reforma Tributária. Também in company.";

export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    absolute: SEO_TITLE,
  },
  description: SEO_DESCRIPTION,
  keywords: [
    "curso de compras",
    "curso de suprimentos",
    "curso de supply chain",
    "curso de procurement",
    "treinamento para compradores",
    "curso de negociação com fornecedores",
    "curso de gestão de contratos",
    "curso de inteligência artificial em compras",
    "curso de reforma tributária para compradores",
    "curso de almoxarifado",
    "strategic sourcing",
    "treinamento in company compras e suprimentos",
    "Academia Brasileira de Suprimentos",
    "2BSUPPLY",
  ],
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${SITE_URL}/`,
    siteName: "Academia Brasileira de Suprimentos",
    title: SEO_TITLE,
    description:
      "Cursos online de Compras, Suprimentos e Supply Chain com certificado e treinamentos in company.",
    images: [
      {
        // Criar este arquivo em /public (1200x630)
        url: "/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Cursos de Compras e Suprimentos - 2BSUPPLY",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description:
      "Cursos online de Compras, Suprimentos e Supply Chain com certificado e treinamentos in company.",
    images: ["/og-home.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HomePage() {
  const supabase = createPublicServerClient();

  const [
    bannerResult,
    categoriesResult,
    trainingsResult,
    testimonialsResult,
  ] = await Promise.all([
    supabase
      .from("treinamentos_banners")
      .select("id, desktop_url, mobile_url")
      .eq("id", "home")
      .maybeSingle(),
    supabase
      .from("treinamentos_categorias")
      .select(
        "id, nome, slug, descricao, icone_svg_url, ativo",
      )
      .eq("ativo", true)
      .order("nome", { ascending: true }),
    supabase
      .from("treinamentos_cursos")
      .select(
        "id, titulo, slug, descricao, imagem_url, destaque, categoria_id, nome_botao_curso, linha_destaque_card, voce_vai_aprender, ordem_home",
      )
      .eq("status", "publicado")
      .order("ordem_home", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("treinamentos_depoimentos")
      .select(
        "id, depoimento, nome, cargo, foto_url, estrelas",
      )
      .order("created_at", { ascending: false }),
  ]);

  for (const [source, error] of [
    ["banner", bannerResult.error],
    ["categorias", categoriesResult.error],
    ["treinamentos", trainingsResult.error],
    ["depoimentos", testimonialsResult.error],
  ] as const) {
    if (error) {
      console.error(
        `Erro ao carregar ${source} da Home:`,
        error,
      );
    }
  }

  const banner = bannerResult.data as BannerHome | null;
  const bannerDesktop =
    banner?.desktop_url ||
    banner?.mobile_url ||
    FALLBACK_BANNER;
  const bannerMobile =
    banner?.mobile_url ||
    banner?.desktop_url ||
    FALLBACK_BANNER;

  const treinamentos = (trainingsResult.data ??
    []) as TreinamentoHome[];

  // Dados estruturados (schema.org)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE_URL}/#organization`,
        name: "Academia Brasileira de Suprimentos",
        alternateName: "2BSUPPLY",
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo-academia-brasileira-de-suprimentos-1.png`,
        description:
          "Cursos online e treinamentos in company de Compras, Suprimentos e Supply Chain.",
        areaServed: "BR",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "Academia Brasileira de Suprimentos",
        inLanguage: "pt-BR",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "ItemList",
        name: "Treinamentos em destaque",
        itemListElement: treinamentos.map((curso, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Course",
            name: curso.titulo,
            url: `${SITE_URL}/cursos/${curso.slug}`,
            provider: { "@id": `${SITE_URL}/#organization` },
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />
      <HomeClient
        categories={
          (categoriesResult.data ?? []) as Categoria[]
        }
        bannerDesktop={bannerDesktop}
        bannerMobile={bannerMobile}
        treinamentos={treinamentos}
        testimonials={
          (testimonialsResult.data ?? []) as Testimonial[]
        }
      />
    </>
  );
}
