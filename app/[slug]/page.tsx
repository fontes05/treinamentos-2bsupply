"use client";

import {
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  Award,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileUser,
  GraduationCap,
  LoaderCircle,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  Video,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/client";

import {
  registrarEventoTreinamento,
} from "@/lib/training-analytics";

import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

/* =========================================================
   TIPOS
========================================================= */

type Curso = {
  id: string;
  titulo: string;
  slug: string;

  categoria_id:
    | number
    | null;

  descricao:
    | string
    | null;

  publico_alvo:
    | string
    | null;

  porque_aprender:
    | string
    | null;

  imagem_url:
    | string
    | null;

  video_introdutorio_url:
    | string
    | null;

  preco_de:
    | number
    | null;

  preco_para:
    | number
    | null;

  parcelamento:
    | string
    | null;

  link_inscricao:
    | string
    | null;
};

type Categoria = {
  id: number;
  nome: string;
  slug: string;
};

type Modulo = {
  id: string;
  titulo: string;
  descricao:
    | string
    | null;
  ordem: number;
};

type Beneficio = {
  id: string;
  titulo: string;
  icone:
    | string
    | null;
  ordem: number;
};

type Certificado = {
  id: string;
  titulo: string;

  descricao:
    | string
    | null;

  imagem_url:
    | string
    | null;

  ordem: number;
};

type Professor = {
  id: string;
  nome: string;

  descricao:
    | string
    | null;

  cargo:
    | string
    | null;

  foto_url:
    | string
    | null;
};

type CursoProfessor = {
  professor_id: string;
};

/* =========================================================
   ÍCONES DOS BENEFÍCIOS
========================================================= */

const benefitIcons = {
  BriefcaseBusiness,
  TrendingUp,
  FileUser,
  Award,
  Target,
  Brain,
  ChartNoAxesCombined,
  Sparkles,
};

type BenefitIconName =
  keyof typeof benefitIcons;

/* =========================================================
   VIDEO
========================================================= */

function getEmbedUrl(
  url: string | null,
) {
  if (!url) {
    return null;
  }

  try {
    const parsed =
      new URL(url);

    /*
     * YouTube
     */
    if (
      parsed.hostname.includes(
        "youtube.com",
      )
    ) {
      /*
       * URL já em embed
       */
      if (
        parsed.pathname.startsWith(
          "/embed/",
        )
      ) {
        return url;
      }

      /*
       * youtube.com/watch?v=...
       */
      const videoId =
        parsed.searchParams.get(
          "v",
        );

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      /*
       * YouTube Shorts
       */
      if (
        parsed.pathname.startsWith(
          "/shorts/",
        )
      ) {
        const id =
          parsed.pathname
            .split("/")
            .filter(Boolean)[1];

        if (id) {
          return `https://www.youtube.com/embed/${id}`;
        }
      }
    }

    /*
     * youtu.be
     */
    if (
      parsed.hostname.includes(
        "youtu.be",
      )
    ) {
      const videoId =
        parsed.pathname
          .replace("/", "")
          .trim();

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    /*
     * Vimeo
     */
    if (
      parsed.hostname.includes(
        "vimeo.com",
      )
    ) {
      const id =
        parsed.pathname
          .split("/")
          .filter(Boolean)
          .pop();

      if (id) {
        return `https://player.vimeo.com/video/${id}`;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/* =========================================================
   FORMATAR PREÇO
========================================================= */

function formatarPreco(
  valor: number | null,
) {
  if (valor == null) {
    return "";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  ).format(valor);
}

/* =========================================================
   PAGE
========================================================= */

export default function TreinamentoPage() {
  const params =
    useParams();

  const router =
    useRouter();

  const slug =
    params.slug as string;

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [
    curso,
    setCurso,
  ] =
    useState<Curso | null>(
      null,
    );

  const [
    categoria,
    setCategoria,
  ] =
    useState<Categoria | null>(
      null,
    );

  const [
    modulos,
    setModulos,
  ] =
    useState<Modulo[]>([]);

  const [
    beneficios,
    setBeneficios,
  ] =
    useState<
      Beneficio[]
    >([]);

  const [
    certificados,
    setCertificados,
  ] =
    useState<
      Certificado[]
    >([]);

  const [
    professor,
    setProfessor,
  ] =
    useState<Professor | null>(
      null,
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    moduloAberto,
    setModuloAberto,
  ] =
    useState<
      string | null
    >(null);

  const [
    videoModalOpen,
    setVideoModalOpen,
  ] =
    useState(false);

  /* =======================================================
     HERO / CARD STICKY
  ======================================================= */

  const heroRef =
    useRef<HTMLElement | null>(
      null,
    );

  const [
    heroVisivel,
    setHeroVisivel,
  ] =
    useState(true);

  useEffect(() => {
    if (
      carregando ||
      !curso
    ) {
      return;
    }

    const hero =
      heroRef.current;

    if (!hero) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setHeroVisivel(
            entry.isIntersecting,
          );
        },
        {
          threshold: 0,
        },
      );

    observer.observe(
      hero,
    );

    return () => {
      observer.disconnect();
    };
  }, [
    carregando,
    curso,
  ]);

  /* =======================================================
     CARREGAR TREINAMENTO
  ======================================================= */

  useEffect(() => {
    if (!slug) {
      return;
    }

    async function carregar() {
      setCarregando(true);

      setErro("");

      const supabase =
        createClient();

      try {
        /* ===============================================
           CURSO
        =============================================== */

        const {
          data:
            cursoData,
          error:
            cursoError,
        } =
          await supabase
            .from(
              "treinamentos_cursos",
            )
            .select(`
              id,
              titulo,
              slug,
              categoria_id,
              descricao,
              publico_alvo,
              porque_aprender,
              imagem_url,
              video_introdutorio_url,
              preco_de,
              preco_para,
              parcelamento,
              link_inscricao
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

        if (
          cursoError
        ) {
          throw new Error(
            cursoError.message,
          );
        }

        if (
          !cursoData
        ) {
          setErro(
            "Treinamento não encontrado.",
          );

          return;
        }

        setCurso(
          cursoData as Curso,
        );

        const cursoId =
          cursoData.id;

        /* ===============================================
           CATEGORIA
        =============================================== */

        if (
          cursoData.categoria_id
        ) {
          const {
            data:
              categoriaData,
            error:
              categoriaError,
          } =
            await supabase
              .from(
                "treinamentos_categorias",
              )
              .select(`
                id,
                nome,
                slug
              `)
              .eq(
                "id",
                cursoData.categoria_id,
              )
              .eq(
                "ativo",
                true,
              )
              .maybeSingle();

          if (
            categoriaError
          ) {
            throw new Error(
              categoriaError.message,
            );
          }

          setCategoria(
            categoriaData as
              | Categoria
              | null,
          );
        } else {
          setCategoria(
            null,
          );
        }

        /* ===============================================
           MÓDULOS
        =============================================== */

        const {
          data:
            modulosData,
          error:
            modulosError,
        } =
          await supabase
            .from(
              "treinamentos_modulos",
            )
            .select(`
              id,
              titulo,
              descricao,
              ordem
            `)
            .eq(
              "curso_id",
              cursoId,
            )
            .eq(
              "ativo",
              true,
            )
            .order(
              "ordem",
              {
                ascending:
                  true,
              },
            );

        if (
          modulosError
        ) {
          throw new Error(
            modulosError.message,
          );
        }

        setModulos(
          (modulosData ??
            []) as Modulo[],
        );

        if (
          modulosData &&
          modulosData.length >
            0
        ) {
          setModuloAberto(
            modulosData[0]
              .id,
          );
        }

        /* ===============================================
           BENEFÍCIOS
        =============================================== */

        const {
          data:
            beneficiosData,
          error:
            beneficiosError,
        } =
          await supabase
            .from(
              "treinamentos_beneficios",
            )
            .select(`
              id,
              titulo,
              icone,
              ordem
            `)
            .eq(
              "curso_id",
              cursoId,
            )
            .eq(
              "ativo",
              true,
            )
            .order(
              "ordem",
              {
                ascending:
                  true,
              },
            );

        if (
          beneficiosError
        ) {
          throw new Error(
            beneficiosError.message,
          );
        }

        setBeneficios(
          (beneficiosData ??
            []) as Beneficio[],
        );

        /* ===============================================
           CERTIFICADOS
        =============================================== */

        const {
          data:
            certificadosData,
          error:
            certificadosError,
        } =
          await supabase
            .from(
              "treinamentos_certificados",
            )
            .select(`
              id,
              titulo,
              descricao,
              imagem_url,
              ordem
            `)
            .eq(
              "curso_id",
              cursoId,
            )
            .eq(
              "ativo",
              true,
            )
            .order(
              "ordem",
              {
                ascending:
                  true,
              },
            );

        if (
          certificadosError
        ) {
          throw new Error(
            certificadosError.message,
          );
        }

        setCertificados(
          (certificadosData ??
            []) as Certificado[],
        );

        /* ===============================================
           PROFESSOR
        =============================================== */

        const {
          data:
            relacao,
          error:
            relacaoError,
        } =
          await supabase
            .from(
              "treinamentos_curso_professores",
            )
            .select(
              "professor_id",
            )
            .eq(
              "curso_id",
              cursoId,
            )
            .order(
              "ordem",
              {
                ascending:
                  true,
              },
            )
            .limit(1)
            .maybeSingle();

        if (
          relacaoError
        ) {
          throw new Error(
            relacaoError.message,
          );
        }

        const relacionamento =
          relacao as
            | CursoProfessor
            | null;

        if (
          relacionamento
            ?.professor_id
        ) {
          const {
            data:
              professorData,
            error:
              professorError,
          } =
            await supabase
              .from(
                "treinamentos_professores",
              )
              .select(`
                id,
                nome,
                descricao,
                cargo,
                foto_url
              `)
              .eq(
                "id",
                relacionamento.professor_id,
              )
              .maybeSingle();

          if (
            professorError
          ) {
            throw new Error(
              professorError.message,
            );
          }

          setProfessor(
            professorData as
              | Professor
              | null,
          );
        } else {
          setProfessor(
            null,
          );
        }
      } catch (
        error
      ) {
        console.error(
          "Erro carregando treinamento:",
          error,
        );

        setErro(
          error instanceof
            Error
            ? error.message
            : "Não foi possível carregar o treinamento.",
        );
      } finally {
        setCarregando(
          false,
        );
      }
    }

    void carregar();
  }, [
    slug,
  ]);

  /* =======================================================
     ANALYTICS - PRÉVIA
  ======================================================= */

  function abrirPreviaCurso() {
    if (!curso) {
      return;
    }

    void registrarEventoTreinamento(
      {
        slug:
          curso.slug,

        titulo:
          curso.titulo,

        evento:
          "previa_click",

        origem:
          `/${curso.slug}`,
      },
    );

    setVideoModalOpen(
      true,
    );
  }

  /* =======================================================
     ANALYTICS - INSCRIÇÃO
  ======================================================= */

  async function handleInscricaoClick(
    event: MouseEvent<HTMLAnchorElement>,
  ) {
    if (!curso) {
      return;
    }

    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    ) {
      void registrarEventoTreinamento(
        {
          slug:
            curso.slug,

          titulo:
            curso.titulo,

          evento:
            "inscricao_click",

          origem:
            `/${curso.slug}`,
        },
      );

      return;
    }

    const destino =
      event.currentTarget.href;

    event.preventDefault();

    await registrarEventoTreinamento(
      {
        slug:
          curso.slug,

        titulo:
          curso.titulo,

        evento:
          "inscricao_click",

        origem:
          `/${curso.slug}`,
      },
    );

    window.location.href =
      destino;
  }

  /* =======================================================
     LOADING
  ======================================================= */

if (carregando) {
  return (
    <>
      <SiteHeader />

      <main className="training-page-loading">
        <LoaderCircle
          size={32}
          className="training-spin"
        />

        <p>
          Carregando treinamento...
        </p>
      </main>

      <SiteFooter />
    </>
  );
}

  /* =======================================================
     ERRO
  ======================================================= */

  if (
  erro ||
  !curso
) {
  return (
    <>
      <SiteHeader />

      <main className="training-not-found">
        <BookOpen
          size={36}
        />

        <h1>
          Treinamento não encontrado
        </h1>

        <p>
          O treinamento informado não está
          disponível ou ainda não foi publicado.
        </p>

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
        >
          <ArrowLeft
            size={17}
          />

          Voltar para o início
        </button>
      </main>

      <SiteFooter />
    </>
  );
}

  /* =======================================================
     VÍDEO
  ======================================================= */

  const embedUrl =
    getEmbedUrl(
      curso.video_introdutorio_url,
    );

  /* =======================================================
     PÁGINA
  ======================================================= */

return (
  <>
    <SiteHeader />

    <main className="training-detail-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section
        ref={
          heroRef
        }
        className="training-detail-hero"
      >
        <div className="container">

          <div className="training-detail-heading">

            <div className="training-breadcrumb">

              <Link href="/">
                Início
              </Link>

              <ChevronRight
                size={14}
              />

              <Link href="/todos">
                Treinamentos
              </Link>

              <ChevronRight
                size={14}
              />

              <span>
                {
                  curso.titulo
                }
              </span>

            </div>

            {/* =============================================
                CATEGORIA DO TREINAMENTO
            ============================================= */}

            {categoria ? (
              <Link
                href={`/todos?categoria=${categoria.slug}`}
                className="section-kicker"
              >
                {
                  categoria.nome
                }
              </Link>
            ) : (
              <span className="section-kicker">
                2BSUPPLY ACADEMY
              </span>
            )}

            <h1>
              {
                curso.titulo
              }
            </h1>

            {curso.descricao && (
              <p className="training-detail-intro">
                {
                  curso.descricao
                }
              </p>
            )}

            <div className="training-detail-meta">

              <span>
                <GraduationCap
                  size={18}
                />

                Treinamento
                profissional
              </span>

              <span>
                <Clock3
                  size={18}
                />

                Acesso online
              </span>

              {professor && (
                <span>
                  <UserRound
                    size={18}
                  />

                  {
                    professor.nome
                  }
                </span>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <div className="container training-detail-layout">

        {/* ===============================================
            CONTEÚDO PRINCIPAL
        =============================================== */}

        <div className="training-detail-main">

          {/* =============================================
              BENEFÍCIOS
          ============================================= */}

          {beneficios.length >
            0 && (
            <section className="training-content-box">

              <div className="training-section-heading">

                <span>
                  O que você vai
                  desenvolver
                </span>

                <h2>
                  Benefícios do
                  treinamento
                </h2>

              </div>

              <div className="training-benefits-grid">

                {beneficios.map(
                  (
                    beneficio,
                  ) => {
                    const Icon =
                      benefitIcons[
                        beneficio.icone as BenefitIconName
                      ] ||
                      Check;

                    return (
                      <div
                        key={
                          beneficio.id
                        }
                        className="training-benefit"
                      >
                        <div className="training-benefit-icon">

                          <Icon
                            size={
                              22
                            }
                          />

                        </div>

                        <span>
                          {
                            beneficio.titulo
                          }
                        </span>
                      </div>
                    );
                  },
                )}

              </div>
            </section>
          )}

          {/* =============================================
              POR QUE APRENDER
          ============================================= */}

          {curso.porque_aprender && (
            <section className="training-section">

              <div className="training-section-heading">

                <span>
                  DESENVOLVIMENTO
                </span>

                <h2>
                  Por que aprender
                  sobre este tema?
                </h2>

              </div>

              <p className="training-section-text">
                {
                  curso.porque_aprender
                }
              </p>

            </section>
          )}

          {/* =============================================
              PÚBLICO ALVO
          ============================================= */}

          {curso.publico_alvo && (
            <section className="training-section">

              <div className="training-section-heading">

                <span>
                  PARA QUEM É
                </span>

                <h2>
                  Público-alvo
                </h2>

              </div>

              <div className="training-audience">

                <Target
                  size={23}
                />

                <p>
                  {
                    curso.publico_alvo
                  }
                </p>

              </div>
            </section>
          )}

          {/* =============================================
              CONTEÚDO DO CURSO
          ============================================= */}

          {modulos.length >
            0 && (
            <section className="training-section">

              <div className="training-section-heading training-section-heading-row">

                <div>

                  <span>
                    CONTEÚDO
                  </span>

                  <h2>
                    Conteúdo do
                    treinamento
                  </h2>

                </div>

                <small>
                  {
                    modulos.length
                  }{" "}
                  módulo
                  {modulos.length ===
                  1
                    ? ""
                    : "s"}
                </small>

              </div>

              <div className="training-modules">

                {modulos.map(
                  (
                    modulo,
                    index,
                  ) => {
                    const aberto =
                      moduloAberto ===
                      modulo.id;

                    return (
                      <article
                        className={`training-module ${
                          aberto
                            ? "training-module-open"
                            : ""
                        }`}
                        key={
                          modulo.id
                        }
                      >
                        <button
                          type="button"
                          className="training-module-header"
                          onClick={() =>
                            setModuloAberto(
                              aberto
                                ? null
                                : modulo.id,
                            )
                          }
                        >
                          <div>

                            <span className="training-module-number">
                              {String(
                                index +
                                  1,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </span>

                            <strong>
                              {
                                modulo.titulo
                              }
                            </strong>

                          </div>

                          <ChevronDown
                            size={
                              20
                            }
                          />

                        </button>

                        {aberto &&
                          modulo.descricao && (
                            <div
                              className="training-module-content"
                              dangerouslySetInnerHTML={{
                                __html:
                                  modulo.descricao,
                              }}
                            />
                          )}

                      </article>
                    );
                  },
                )}

              </div>
            </section>
          )}

          {/* =============================================
              PROFESSOR
          ============================================= */}

          {professor && (
            <section className="training-section">

              <div className="training-section-heading">

                <span>
                  ESPECIALISTA
                </span>

                <h2>
                  Professor
                </h2>

              </div>

              <div className="training-professor">

                <div className="training-professor-photo">

                  {professor.foto_url ? (
                    <img
                      src={
                        professor.foto_url
                      }
                      alt={
                        professor.nome
                      }
                    />
                  ) : (
                    <UserRound
                      size={
                        42
                      }
                    />
                  )}

                </div>

                <div className="training-professor-content">

                  <h3>
                    {
                      professor.nome
                    }
                  </h3>

                  {professor.cargo && (
                    <span>
                      {
                        professor.cargo
                      }
                    </span>
                  )}

                  {professor.descricao && (
                    <p>
                      {
                        professor.descricao
                      }
                    </p>
                  )}

                </div>
              </div>
            </section>
          )}

          {/* =============================================
              CERTIFICADOS
          ============================================= */}

          {certificados.length >
            0 && (
            <section className="training-section">

              <div className="training-section-heading">

                <span>
                  CERTIFICAÇÃO
                </span>

                <h2>
                  Certificados
                </h2>

              </div>

              <div className="training-certificates">

                {certificados.map(
                  (
                    certificado,
                  ) => (
                    <article
                      className="training-certificate"
                      key={
                        certificado.id
                      }
                    >

                      {certificado.imagem_url && (
                        <div className="training-certificate-image">

                          <img
                            src={
                              certificado.imagem_url
                            }
                            alt={
                              certificado.titulo
                            }
                          />

                        </div>
                      )}

                      <div className="training-certificate-content">

                        <div className="training-certificate-icon">

                          <Award
                            size={
                              20
                            }
                          />

                        </div>

                        <h3>
                          {
                            certificado.titulo
                          }
                        </h3>

                        {certificado.descricao && (
                          <p>
                            {
                              certificado.descricao
                            }
                          </p>
                        )}

                      </div>
                    </article>
                  ),
                )}

              </div>
            </section>
          )}

          {/* =============================================
              CTA FINAL
          ============================================= */}

          <section className="training-final-cta">

            <div>

              <span>
                2BSUPPLY ACADEMY
              </span>

              <h2>
                Pronto para
                desenvolver novas
                competências?
              </h2>

              <p>
                Converse com nossa
                equipe e saiba mais
                sobre este
                treinamento.
              </p>

            </div>

            <Link href="/contato">

              Falar com um
              especialista

              <ExternalLink
                size={17}
              />

            </Link>

          </section>
        </div>

        {/* =================================================
            CARD LATERAL STICKY
        ================================================= */}

        <aside
          className={`training-video-sidebar ${
            heroVisivel
              ? "training-video-visible"
              : "training-video-hidden"
          }`}
        >
          <div className="training-video-card">

            {/* =============================================
                CAPA / VÍDEO
            ============================================= */}

            <div className="training-video">

              {curso.imagem_url ? (

                <div className="training-video-image">

                  <img
                    src={
                      curso.imagem_url
                    }
                    alt={
                      curso.titulo
                    }
                  />

                  {embedUrl && (
                    <button
                      type="button"
                      className="training-video-play"
                      aria-label="Assistir prévia do curso"
                      onClick={
                        abrirPreviaCurso
                      }
                    >
                      <Play
                        size={
                          28
                        }
                        fill="currentColor"
                      />
                    </button>
                  )}

                </div>

              ) : (

                <div className="training-video-placeholder">

                  <Video
                    size={42}
                  />

                  <span>
                    Vídeo
                    introdutório
                  </span>

                  {embedUrl && (
                    <button
                      type="button"
                      className="training-video-placeholder-button"
                      onClick={
                        abrirPreviaCurso
                      }
                    >
                      <Play
                        size={
                          18
                        }
                        fill="currentColor"
                      />

                      Assistir vídeo
                    </button>
                  )}

                </div>

              )}

            </div>

           {/* =============================================
    CONTEÚDO DO CARD
============================================= */}

<div className="training-video-content">

  <span className="training-video-label">
    TREINAMENTO 2BSUPPLY
  </span>

  {/* ===========================================
      PREÇOS
  =========================================== */}

  {(curso.preco_de != null ||
    curso.preco_para != null ||
    curso.parcelamento) && (
    <div className="training-video-price">

      {curso.preco_de != null && (
        <div className="training-video-price-old">
          <span>De</span>

          <strong>
            {formatarPreco(
              curso.preco_de,
            )}
          </strong>
        </div>
      )}

      {curso.preco_para != null && (
        <div className="training-video-price-current">
          <span>Por</span>

          <strong>
            {formatarPreco(
              curso.preco_para,
            )}
          </strong>
        </div>
      )}

      {curso.parcelamento && (
        <div className="training-video-installments">
          {curso.parcelamento}
        </div>
      )}

    </div>
  )}

  {/* ===========================================
      INSCRIÇÃO + ANALYTICS
  =========================================== */}

  <Link
    href={
      curso.link_inscricao ||
      "/contato"
    }
    className="training-video-primary"
    onClick={
      handleInscricaoClick
    }
  >
    Inscreva-se agora
  </Link>

  <Link
    href="/todos"
    className="training-video-secondary"
  >
    Ver outros treinamentos
  </Link>

</div>
</div>
</aside>

        {/* =================================================
            MODAL / PRÉVIA DO CURSO
        ================================================= */}

        <Dialog
          open={
            videoModalOpen
          }
          onOpenChange={
            setVideoModalOpen
          }
        >
          <DialogContent
            className="
              training-preview-modal
              !w-[92vw]
              !max-w-[1150px]
              overflow-hidden
              border-0
              bg-[#15151d]
              p-0
              text-white
              shadow-2xl
            "
          >

            {/* =============================================
                CABEÇALHO
            ============================================= */}

            <DialogHeader className="training-preview-header">

              <span className="section-kicker">
                Prévia do curso
              </span>

              <DialogTitle className="training-preview-title">
                {
                  curso.titulo
                }
              </DialogTitle>

            </DialogHeader>

            {/* =============================================
                VÍDEO
            ============================================= */}

            {embedUrl &&
              videoModalOpen && (
                <div className="training-preview-player">

                  <iframe
                    src={
                      embedUrl
                    }
                    title={`Prévia do curso - ${curso.titulo}`}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />

                </div>
              )}

          </DialogContent>
        </Dialog>

          </div>
    </main>

    <SiteFooter />
  </>
);
}