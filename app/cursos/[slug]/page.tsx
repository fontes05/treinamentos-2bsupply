import type { Metadata } from "next";
import { cache } from "react";

import {
  createClient as createSupabaseClient,
} from "@supabase/supabase-js";

import TreinamentoClient from "./TreinamentoClient";

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const SITE_URL =
  "https://absuprimentos.com.br";

const SITE_NAME =
  "Academia Brasileira de Suprimentos";

export const dynamic =
  "force-dynamic";

/* =========================================================
   TIPOS
========================================================= */

type CursoSeo = {
  titulo: string;
  slug: string;

  descricao:
    | string
    | null;

  seo_titulo:
    | string
    | null;

  seo_descricao:
    | string
    | null;

  seo_palavra_chave:
    | string
    | null;

  imagem_url:
    | string
    | null;

  preco_para:
    | number
    | null;

  link_inscricao:
    | string
    | null;

  status:
    | string
    | null;
};

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   SUPABASE
========================================================= */

function getSupabase() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    return null;
  }

  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

/* =========================================================
   BUSCAR DADOS DE SEO DO CURSO
========================================================= */

const getCursoSeo = cache(
  async (
    slug: string,
  ): Promise<CursoSeo | null> => {
    const supabase =
      getSupabase();

    if (!supabase) {
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "treinamentos_cursos",
      )
      .select(`
        titulo,
        slug,
        descricao,
        seo_titulo,
        seo_descricao,
        seo_palavra_chave,
        imagem_url,
        preco_para,
        link_inscricao,
        status
      `)
      .eq(
        "slug",
        slug,
      )
      .eq(
        "status",
        "publicado",
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao carregar SEO do treinamento:",
        error,
      );

      return null;
    }

    return data as CursoSeo | null;
  },
);

/* =========================================================
   HELPERS
========================================================= */

function limparTexto(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "";
  }

  return value
    .replace(
      /<[^>]*>/g,
      " ",
    )
    .replace(
      /\s+/g,
      " ",
    )
    .trim();
}

function limitarTexto(
  value: string,
  limite: number,
) {
  if (
    value.length <=
    limite
  ) {
    return value;
  }

  return `${value
    .slice(
      0,
      Math.max(
        0,
        limite - 1,
      ),
    )
    .trim()}…`;
}

/* =========================================================
   METADATA / SEO
========================================================= */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    slug,
  } = await params;

  const curso =
    await getCursoSeo(
      slug,
    );

  const canonicalUrl =
    `${SITE_URL}/cursos/${encodeURIComponent(
      slug,
    )}`;

  /*
   * Curso inexistente ou não publicado.
   */
  if (!curso) {
    return {
      title:
        `Treinamento não encontrado | ${SITE_NAME}`,

      description:
        "O treinamento informado não está disponível.",

      alternates: {
        canonical:
          canonicalUrl,
      },

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const titulo =
    limparTexto(
      curso.seo_titulo,
    ) ||
    limparTexto(
      curso.titulo,
    );

  const descricaoBase =
    limparTexto(
      curso.seo_descricao,
    ) ||
    limparTexto(
      curso.descricao,
    ) ||
    `Conheça o treinamento ${curso.titulo} da ${SITE_NAME}.`;

  const descricao =
    limitarTexto(
      descricaoBase,
      160,
    );

  const imagem =
    curso.imagem_url ||
    undefined;

  const palavraChave =
    limparTexto(
      curso.seo_palavra_chave,
    );

  return {
    title: titulo,

    description:
      descricao,

    keywords:
      palavraChave
        ? [
            palavraChave,
          ]
        : undefined,

    alternates: {
      canonical:
        canonicalUrl,
    },

    openGraph: {
      type:
        "website",

      locale:
        "pt_BR",

      url:
        canonicalUrl,

      siteName:
        SITE_NAME,

      title:
        titulo,

      description:
        descricao,

      images:
        imagem
          ? [
              {
                url:
                  imagem,

                alt:
                  curso.titulo,
              },
            ]
          : undefined,
    },

    twitter: {
      card:
        imagem
          ? "summary_large_image"
          : "summary",

      title:
        titulo,

      description:
        descricao,

      images:
        imagem
          ? [
              imagem,
            ]
          : undefined,
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview":
          "large",
        "max-snippet":
          -1,
        "max-video-preview":
          -1,
      },
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function TreinamentoPage({
  params,
}: PageProps) {
  const {
    slug,
  } = await params;

  const curso =
    await getCursoSeo(
      slug,
    );

  const canonicalUrl =
    `${SITE_URL}/cursos/${encodeURIComponent(
      slug,
    )}`;

  const schema =
    curso
      ? {
          "@context":
            "https://schema.org",

          "@type":
            "Course",

          name:
            curso.titulo,

          description:
            limparTexto(
              curso.seo_descricao,
            ) ||
            limparTexto(
              curso.descricao,
            ) ||
            `Treinamento ${curso.titulo}`,

          url:
            canonicalUrl,

          ...(curso.imagem_url
            ? {
                image:
                  curso.imagem_url,
              }
            : {}),

          provider: {
            "@type":
              "Organization",

            name:
              SITE_NAME,

            url:
              SITE_URL,
          },

          ...(curso.preco_para != null
            ? {
                offers: {
                  "@type":
                    "Offer",

                  priceCurrency:
                    "BRL",

                  price:
                    String(
                      curso.preco_para,
                    ),

                  url:
                    curso.link_inscricao ||
                    canonicalUrl,

                  availability:
                    "https://schema.org/InStock",
                },
              }
            : {}),
        }
      : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html:
              JSON.stringify(
                schema,
              ).replace(
                /</g,
                "\\u003c",
              ),
          }}
        />
      )}

      <TreinamentoClient />
    </>
  );
}
