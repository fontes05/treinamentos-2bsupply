import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/cursos/gestao-tributaria",
        destination: "/cursos/curso-tributacao-para-compradores",
        permanent: true,
      },
      {
        source: "/cursos/tributacao-para-o-setor-de-compras",
        destination: "/cursos/curso-tributacao-para-compradores",
        permanent: true,
      },
      {
        source: "/cursos/ia-em-suprimentos",
        destination: "/cursos/curso-inteligencia-artificial-compras",
        permanent: true,
      },
      {
        source: "/cursos/curso-ia-em-suprimentos",
        destination: "/cursos/curso-inteligencia-artificial-compras",
        permanent: true,
      },
      {
        source: "/cursos/curso-de-gestao-de-contratos-e-fornecedores",
        destination: "/cursos/curso-gestao-de-contratos-suprimentos",
        permanent: true,
      },
      {
        source: "/cursos/curso-negociacao-em-compras",
        destination: "/cursos/curso-negociacao-para-compradores",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "taydbrfqmgvjzelvablx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
