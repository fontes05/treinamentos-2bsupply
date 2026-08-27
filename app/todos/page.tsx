"use client";

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
        origem: "/todos",
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
      origem: "/todos",
    });

    router.push(
      `/${curso.slug}`,
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
                "clamp(44px, 4vw, 44px)",
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
      ====================================================== */}

      <section className="section courses-section todos">
        <div className="container">

          {/* LOADING */}

          {carregando && (
            <div
              style={{
                minHeight:
                  "300px",
                display:
                  "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "12px",
                  opacity:
                    0.7,
                }}
              >
                <LoaderCircle
                  size={22}
                  className="animate-spin"
                />

                Carregando
                treinamentos...
              </div>
            </div>
          )}

          {/* ERRO */}

          {!carregando &&
            erro && (
              <div
                style={{
                  minHeight:
                    "300px",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  textAlign:
                    "center",
                  gap:
                    "15px",
                }}
              >
                <BookOpen
                  size={36}
                />

                <h2>
                  Não foi possível
                  carregar os
                  treinamentos
                </h2>

                <p
                  style={{
                    opacity:
                      0.7,
                  }}
                >
                  {erro}
                </p>
              </div>
            )}

          {/* NENHUM CURSO */}

          {!carregando &&
            !erro &&
            treinamentos.length ===
              0 && (
              <div
                style={{
                  minHeight:
                    "300px",
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  textAlign:
                    "center",
                  gap:
                    "15px",
                }}
              >
                <BookOpen
                  size={38}
                />

                <h2>
                  Nenhum treinamento
                  publicado
                </h2>

                <p
                  style={{
                    opacity:
                      0.7,
                  }}
                >
                  Novos treinamentos
                  serão disponibilizados
                  em breve.
                </p>
              </div>
            )}

          {/* GRID */}

          {!carregando &&
            !erro &&
            treinamentos.length >
              0 && (
              <div className="courses-grid todostreinamentos">

                {treinamentos.map(
                  (
                    curso,
                    index,
                  ) => (
                    <Link
                      key={
                        curso.id
                      }
                      href={`/${curso.slug}`}
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
                          (index %
                            5) +
                          1
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
                          {
                            curso.titulo
                          }
                        </h3>

                        {curso.descricao && (
                          <p>
                            {
                              curso.descricao
                            }
                          </p>
                        )}

                        <div className="course-bottom">

                          <span>
                            Conhecer
                            treinamento
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

      <section
        className="section company-section todoscta"
      >
        <div className="container">

          <div className="company-box">

            <div className="company-content">

              <span className="section-kicker">
                TREINAMENTOS
                IN COMPANY
              </span>

              <h2>
                Precisa desenvolver
                sua equipe?
              </h2>

              <p>
                Conheça nossos
                programas personalizados
                para empresas e equipes
                de Compras, Suprimentos
                e Supply Chain.
              </p>

              <Link
                href="/contato"
                className="primary-button"
              >
                Falar com um
                especialista

                <ArrowRight
                  size={18}
                />
              </Link>

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