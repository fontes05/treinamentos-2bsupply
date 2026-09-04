"use client";

import Image from "next/image";

import {
  useEffect,
  useState,
  type MouseEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  BookOpen,
  LoaderCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import {
  registrarEventoTreinamento,
} from "@/lib/training-analytics";

import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

/* =========================================================
   TIPOS
========================================================= */

type Treinamento = {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function TodosTreinamentosPage() {
  const router = useRouter();

  const [
    treinamentos,
    setTreinamentos,
  ] = useState<Treinamento[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  /* =======================================================
     CARREGAR TREINAMENTOS
  ======================================================= */

  useEffect(() => {
    async function carregarTreinamentos() {
      setCarregando(true);
      setErro("");

      const supabase =
        createClient();

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "treinamentos_cursos",
          )
          .select(`
            id,
            titulo,
            slug,
            descricao,
            imagem_url
          `)
          .eq(
            "status",
            "publicado",
          )
          .order(
            "titulo",
            {
              ascending: true,
            },
          );

        if (error) {
          throw new Error(
            error.message,
          );
        }

        setTreinamentos(
          (data ??
            []) as Treinamento[],
        );
      } catch (error) {
        console.error(
          "Erro ao carregar treinamentos:",
          error,
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os treinamentos.",
        );
      } finally {
        setCarregando(false);
      }
    }

    void carregarTreinamentos();
  }, []);

  /* =======================================================
     CLIQUE NO CURSO + ANALYTICS
  ======================================================= */

  async function handleCursoClick(
    event: MouseEvent<HTMLAnchorElement>,
    curso: Treinamento,
  ) {
    /*
     * Ctrl/Cmd/Shift continuam permitindo
     * abrir em outra aba normalmente.
     */
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      void registrarEventoTreinamento({
        slug: curso.slug,
        titulo: curso.titulo,
        evento: "curso_click",
        origem: "/cursos",
      });

      return;
    }

    /*
     * No clique normal aguardamos o Supabase
     * registrar antes da navegação.
     */
    event.preventDefault();

    await registrarEventoTreinamento({
      slug: curso.slug,
      titulo: curso.titulo,
      evento: "curso_click",
      origem: "/cursos",
    });

    router.push(
      `/cursos/${curso.slug}`,
    );
  }

  return (
    <main>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <SiteHeader />

      {/* =====================================================
          CABEÇALHO DA PÁGINA
      ====================================================== */}

      <section
        style={{
          paddingTop:
            "80px",
          paddingBottom:
            "55px",
        }}
      >
        <div className="container">

          <span className="section-kicker">
            2BSUPPLY ACADEMY
          </span>

          <h1
            style={{
              marginTop:
                "14px",
              fontSize:
                "clamp(28px, 4vw, 44px)",
              lineHeight:
                "1.05",
              maxWidth:
                "850px",
              fontWeight:
                "750",
            }}
          >
            Todos os treinamentos
          </h1>

          <p
            style={{
              marginTop:
                "10px",
              fontWeight:
                "400",
              fontSize:
                "17px",
              lineHeight:
                "1.7",
              opacity:
                0.72,
            }}
          >
            Encontre o treinamento
            ideal para desenvolver
            competências estratégicas
            em Compras, Suprimentos e
            Supply Chain.
          </p>

        </div>
      </section>

{/* =====================================================
    TREINAMENTOS
===================================================== */}

<section className="section courses-section todos">
  <div className="container">

    {/* LOADING */}

    {carregando && (
      <div
        style={{
          minHeight: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            opacity: 0.7,
          }}
        >
          <LoaderCircle
            size={22}
            className="animate-spin"
          />

          Carregando treinamentos...
        </div>
      </div>
    )}

    {/* ERRO */}

    {!carregando && erro && (
      <div
        style={{
          minHeight: "300px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "15px",
        }}
      >
        <BookOpen size={36} />

        <h2>
          Não foi possível carregar os treinamentos
        </h2>

        <p
          style={{
            opacity: 0.7,
          }}
        >
          {erro}
        </p>
      </div>
    )}

    {/* NENHUM CURSO */}

    {!carregando &&
      !erro &&
      treinamentos.length === 0 && (
        <div
          style={{
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "15px",
          }}
        >
          <BookOpen size={38} />

          <h2>
            Nenhum treinamento publicado
          </h2>

          <p
            style={{
              opacity: 0.7,
            }}
          >
            Novos treinamentos serão disponibilizados em breve.
          </p>
        </div>
      )}

    {/* GRID */}

    {!carregando &&
      !erro &&
      treinamentos.length > 0 && (
        <div className="courses-grid todostreinamentos">

          {treinamentos.map(
            (
              curso,
              index,
            ) => (
              <Link
                key={curso.id}
                href={`/cursos/${curso.slug}`}
                className="course-card"
                onClick={(
                  event,
                ) =>
                  handleCursoClick(
                    event,
                    curso,
                  )
                }
              >

                {/* CAPA */}

                <div
                  className={`course-cover course-cover-${
                    (index % 5) + 1
                  }`}
                  style={
                    curso.imagem_url
                      ? {
                          backgroundImage: `
                            linear-gradient(
                              180deg,
                              rgba(10, 15, 25, 0.05) 0%,
                              rgba(10, 15, 25, 0.45) 100%
                            ),
                            url("${curso.imagem_url}")
                          `,
                          backgroundSize:
                            "cover",
                          backgroundPosition:
                            "center",
                        }
                      : undefined
                  }
                >

                  {!curso.imagem_url && (
                    <div className="course-visual-icon">
                      {getIniciais(
                        curso.titulo,
                      )}
                    </div>
                  )}

                  <div className="course-pattern" />
                </div>

                {/* CONTEÚDO */}

                <div className="course-content">

                  <div className="course-category">
                    2BSUPPLY ACADEMY
                  </div>

                  <h3>
                    {curso.titulo}
                  </h3>

                  {curso.descricao && (
                    <p>
                      {curso.descricao}
                    </p>
                  )}

                  <div className="course-bottom">

                    <span>
                      Conhecer treinamento
                    </span>

                    <ArrowRight
                      size={18}
                    />

                  </div>

                </div>
              </Link>
            ),
          )}

        </div>
      )}

  </div>
</section>

      {/* =====================================================
          CTA
      ====================================================== */}

      <section className="section company-section todoscta">
  <div className="container">
    <div className="company-box">
      <div className="company-content">
        <span className="section-kicker">
          TREINAMENTOS IN COMPANY
        </span>

        <h2>
          Precisa desenvolver sua equipe?
        </h2>

        <p>
          Conheça nossos programas personalizados
          para empresas e equipes de Compras,
          Suprimentos e Supply Chain.
        </p>

        <Link
  href="https://api.whatsapp.com/send?phone=5521999792912" target="_blank"
  className="primary-button"
>
  <svg
    viewBox="0 0 32 32"
    aria-hidden="true"
    style={{
      width: "20px",
      height: "20px",
      fill: "currentColor",
      stroke: "none",
      flexShrink: 0,
    }}
  >
    <path d="M16.01 3C8.83 3 3 8.72 3 15.78c0 2.25.6 4.45 1.74 6.39L3 28.5l6.53-1.7a13.1 13.1 0 0 0 6.47 1.68h.01C23.19 28.48 29 22.76 29 15.7 29 8.65 23.19 3 16.01 3Zm0 23.32a10.9 10.9 0 0 1-5.56-1.5l-.4-.24-3.88 1.01 1.04-3.75-.26-.39a10.55 10.55 0 0 1-1.7-5.67c0-5.84 4.83-10.59 10.77-10.59 5.93 0 10.75 4.75 10.75 10.59 0 5.83-4.82 10.54-10.76 10.54Zm5.9-7.92c-.32-.16-1.91-.93-2.21-1.04-.3-.11-.52-.16-.74.16-.22.32-.85 1.04-1.04 1.25-.19.21-.38.24-.71.08-.32-.16-1.36-.49-2.59-1.57-.96-.84-1.61-1.88-1.8-2.2-.19-.32-.02-.49.14-.65.15-.14.32-.37.49-.56.16-.19.22-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.74-1.76-1.01-2.41-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.4-.3.32-1.15 1.12-1.15 2.73 0 1.61 1.19 3.16 1.35 3.38.16.21 2.34 3.51 5.67 4.92.79.34 1.41.54 1.89.69.79.25 1.52.21 2.09.13.64-.09 1.91-.77 2.18-1.51.27-.75.27-1.39.19-1.52-.08-.13-.3-.21-.62-.37Z" />
  </svg>

  Falar com um especialista
</Link>
      </div>

      <div className="company-image-wrapper">
        <Image
          src="/reuniao-estrategica-com-dashboard-global.png"
          alt="Equipe em reunião estratégica de supply chain"
          width={900}
          height={600}
          className="company-image"
        />
      </div>
    </div>
  </div>
</section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <SiteFooter />

    </main>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getIniciais(
  titulo: string,
) {
  return titulo
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (palavra) =>
        palavra[0],
    )
    .join("")
    .toUpperCase();
}