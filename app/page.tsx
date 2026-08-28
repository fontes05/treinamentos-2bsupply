"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { registrarEventoTreinamento } from "@/lib/training-analytics";

import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

/* =========================================================
   TIPOS
========================================================= */

type Categoria = {
  id: number;
  nome: string;
  slug: string;
  descricao: string | null;
  icone_svg_url: string | null;
  ativo: boolean;
};

type TreinamentoHome = {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  destaque: boolean;
  categoria_id: number | null;
};

type BannerHome = {
  id: string;
  desktop_url: string | null;
  mobile_url: string | null;
};

type Testimonial = {
  id: string;
  depoimento: string;
  nome: string;
  cargo: string;
  foto_url: string | null;
  estrelas: number;
};

type NewsletterMessageType =
  | "success"
  | "error"
  | null;

/* =========================================================
   HOME
========================================================= */

export default function Home() {
  /* =======================================================
     ESTADOS
  ======================================================= */

  const [categories, setCategories] =
    useState<Categoria[]>([]);

  const [
    bannerDesktop,
    setBannerDesktop,
  ] = useState("/");

  const [
    bannerMobile,
    setBannerMobile,
  ] = useState("/");

  const [treinamentos, setTreinamentos] =
    useState<TreinamentoHome[]>([]);

  const [
    carregandoTreinamentos,
    setCarregandoTreinamentos,
  ] = useState(true);

  const [
    testimonials,
    setTestimonials,
  ] = useState<Testimonial[]>([]);

  const [
    carregandoDepoimentos,
    setCarregandoDepoimentos,
  ] = useState(true);

  /* =======================================================
     NEWSLETTER
  ======================================================= */

  const [
    newsletterNome,
    setNewsletterNome,
  ] = useState("");

  const [
    newsletterEmail,
    setNewsletterEmail,
  ] = useState("");

  const [
    enviandoNewsletter,
    setEnviandoNewsletter,
  ] = useState(false);

  const [
    newsletterMessage,
    setNewsletterMessage,
  ] = useState("");

  const [
    newsletterMessageType,
    setNewsletterMessageType,
  ] = useState<NewsletterMessageType>(
    null,
  );

  /* =======================================================
     REF DO SLIDER DE DEPOIMENTOS
  ======================================================= */

  const testimonialsSliderRef =
    useRef<HTMLDivElement | null>(null);

  /* =======================================================
     MOVER SLIDER DE DEPOIMENTOS
  ======================================================= */

  function moverDepoimentos(
    direcao: "prev" | "next",
  ) {
    const slider =
      testimonialsSliderRef.current;

    if (!slider) {
      return;
    }

    const primeiroCard =
      slider.querySelector<HTMLElement>(
        ".testimonial-card",
      );

    if (!primeiroCard) {
      return;
    }

    const estilos =
      window.getComputedStyle(slider);

    const gap =
      parseFloat(
        estilos.columnGap ||
          estilos.gap ||
          "0",
      ) || 0;

    const distancia =
      primeiroCard.offsetWidth +
      gap;

    slider.scrollBy({
      left:
        direcao === "next"
          ? distancia
          : -distancia,

      behavior: "smooth",
    });
  }

  /* =======================================================
     BANNER DA HOME
  ======================================================= */

  useEffect(() => {
    async function carregarBannerHome() {
      const supabase =
        createClient();

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "treinamentos_banners",
          )
          .select(
            `
              id,
              desktop_url,
              mobile_url
            `,
          )
          .eq(
            "id",
            "home",
          )
          .maybeSingle();

        if (error) {
          console.error(
            "Erro ao carregar banner da Home:",
            error,
          );

          return;
        }

        if (!data) {
          return;
        }

        const banner =
          data as BannerHome;

        const desktop =
          banner.desktop_url ||
          banner.mobile_url ||
          "/";

        const mobile =
          banner.mobile_url ||
          banner.desktop_url ||
          "/";

        setBannerDesktop(
          desktop,
        );

        setBannerMobile(
          mobile,
        );
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar banner da Home:",
          error,
        );
      }
    }

    void carregarBannerHome();
  }, []);

  /* =======================================================
     CATEGORIAS DO SUPABASE
  ======================================================= */

  useEffect(() => {
    async function carregarCategorias() {
      const supabase =
        createClient();

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "treinamentos_categorias",
          )
          .select(
            `
              id,
              nome,
              slug,
              descricao,
              icone_svg_url,
              ativo
            `,
          )
          .eq(
            "ativo",
            true,
          )
          .order(
            "nome",
            {
              ascending: true,
            },
          );

        if (error) {
          console.error(
            "Erro ao carregar categorias:",
            error,
          );

          return;
        }

        setCategories(
          (data ?? []) as Categoria[],
        );
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar categorias:",
          error,
        );
      }
    }

    void carregarCategorias();
  }, []);

 /* =======================================================
   TREINAMENTOS DO SUPABASE
======================================================= */

useEffect(() => {
  async function carregarTreinamentos() {
    setCarregandoTreinamentos(
      true,
    );

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
        .select(
          `
            id,
            titulo,
            slug,
            descricao,
            imagem_url,
            destaque,
            categoria_id
          `,
        )
        .eq(
          "status",
          "publicado",
        )
        .order(
          "destaque",
          {
            ascending: false,
          },
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(5);

      if (error) {
        console.error(
          "Erro ao carregar treinamentos:",
          error,
        );

        return;
      }

      setTreinamentos(
        (data ?? []) as TreinamentoHome[],
      );
    } catch (error) {
      console.error(
        "Erro inesperado ao carregar treinamentos:",
        error,
      );
    } finally {
      setCarregandoTreinamentos(
        false,
      );
    }
  }

  void carregarTreinamentos();
}, []);
  /* =======================================================
     DEPOIMENTOS DO SUPABASE
  ======================================================= */

  useEffect(() => {
    async function carregarDepoimentos() {
      setCarregandoDepoimentos(
        true,
      );

      const supabase =
        createClient();

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "treinamentos_depoimentos",
          )
          .select(
            `
              id,
              depoimento,
              nome,
              cargo,
              foto_url,
              estrelas
            `,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

        if (error) {
          console.error(
            "Erro ao carregar depoimentos:",
            error,
          );

          return;
        }

        setTestimonials(
          (data ?? []) as Testimonial[],
        );
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar depoimentos:",
          error,
        );
      } finally {
        setCarregandoDepoimentos(
          false,
        );
      }
    }

    void carregarDepoimentos();
  }, []);

 /* =======================================================
   CADASTRAR NEWSLETTER
======================================================= */

async function handleNewsletterSubmit(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  if (enviandoNewsletter) {
    return;
  }

  const nome = newsletterNome.trim();

  const email = newsletterEmail
    .trim()
    .toLowerCase();

  setNewsletterMessage("");
  setNewsletterMessageType(null);

  /* =============================================
     VALIDA NOME
  ============================================= */

  if (!nome) {
    setNewsletterMessage(
      "Informe seu nome."
    );

    setNewsletterMessageType(
      "error"
    );

    return;
  }

  if (nome.length < 2) {
    setNewsletterMessage(
      "Informe um nome válido."
    );

    setNewsletterMessageType(
      "error"
    );

    return;
  }

  /* =============================================
     VALIDA E-MAIL
  ============================================= */

  if (!email) {
    setNewsletterMessage(
      "Informe seu e-mail."
    );

    setNewsletterMessageType(
      "error"
    );

    return;
  }

  const emailValido =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );

  if (!emailValido) {
    setNewsletterMessage(
      "Informe um e-mail válido."
    );

    setNewsletterMessageType(
      "error"
    );

    return;
  }

  /* =============================================
     ENVIA PARA O SUPABASE
  ============================================= */

  setEnviandoNewsletter(true);

  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("treinamentos_newsletter")
      .insert({
        nome,
        email,
      });

    /* =========================================
       VERIFICA E-MAIL DUPLICADO
    ========================================= */

    if (error) {
      if (error.code === "23505") {
        setNewsletterMessage(
          "Este e-mail já está cadastrado em nossa base de newsletter."
        );

        setNewsletterMessageType(
          "error"
        );

        return;
      }

      throw error;
    }

    /* =========================================
       SUCESSO
    ========================================= */

    setNewsletterMessage(
      "Cadastro realizado! Você receberá nossas novidades em breve."
    );

    setNewsletterMessageType(
      "success"
    );

    setNewsletterNome("");
    setNewsletterEmail("");
  } catch (error) {
    console.error(
      "Erro ao cadastrar newsletter:",
      error
    );

    setNewsletterMessage(
      "Não foi possível realizar seu cadastro. Tente novamente."
    );

    setNewsletterMessageType(
      "error"
    );
  } finally {
    setEnviandoNewsletter(false);
  }
}
  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main>
      {/* =====================================================
          HEADER
      ====================================================== */}

      <SiteHeader />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="hero">
        <div className="hero-background">
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet={bannerMobile}
            />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerDesktop}
              alt="Treinamentos 2BSUPPLY"
              className="hero-background-image"
              fetchPriority="high"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center center",
                display: "block",
              }}
            />
          </picture>

          <div className="hero-background-overlay" />
        </div>

        <div className="container hero-inner">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-dot" />

              TREINAMENTOS PARA PROFISSIONAIS DE SUPRIMENTOS
            </div>

            <h1>
              Conhecimento que transforma

              <span>
                Impulsione sua carreira.
              </span>
            </h1>

            <p className="hero-description">
              Desenvolva competências estratégicas em Compras,
              Suprimentos e Supply Chain com treinamentos
              práticos, atuais e conectados aos desafios reais
              do mercado.
            </p>

            <div className="hero-actions">
              <Link
                href="/cursos"
                className="primary-button"
              >
                Explorar treinamentos

                <ArrowRightIcon />
              </Link>

             
            </div>
          </div>
        </div>

{/* =====================================================
    CATEGORIAS
===================================================== */}

<div
  className="container hero-categories"
  id="areas"
>
  <div className="categories hidden md:grid">
    {categories.map(
      (category) => (
        <Link
          href={`/cursos?categoria=${encodeURIComponent(
            category.slug,
          )}`}
          className="category-card"
          key={category.id}
        >
          <div className="category-icon">
            {category.icone_svg_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={category.icone_svg_url}
                  alt={`Ícone ${category.nome}`}
                  className="category-svg"
                />
              </>
            ) : (
              <CategoryIcon />
            )}
          </div>

          <div>
            <strong>
              {category.nome}
            </strong>
          </div>

          <ArrowRightIcon />
        </Link>
      ),
    )}
  </div>
</div>
      </section>

{/* =====================================================
    CURSOS
====================================================== */}

<section className="section courses-section">
  <div className="container">
    <div className="section-header">
      <div>
        <span className="section-kicker">
          TREINAMENTOS EM DESTAQUE
        </span>

        <h2>
          Conhecimento para{" "}
          <span>
            avançar na sua carreira
          </span>
        </h2>

        <p>
          Escolha o treinamento ideal para desenvolver
          novas competências e elevar sua atuação
          profissional.
        </p>
      </div>

      <Link
        href="/cursos"
        className="view-all"
      >
        Ver todos os treinamentos

        <ArrowRightIcon />
      </Link>
    </div>

    <div className="courses-grid">
      {treinamentos.map(
        (
          course,
          index,
        ) => {
          /* =========================================
             LOCALIZA A CATEGORIA DO CURSO
          ========================================= */

          const categoria =
            categories.find(
              (category) =>
                category.id ===
                course.categoria_id,
            );

          return (
            <Link
             href={`/cursos/${course.slug}`}
              className="course-card"
              key={course.id}
              onClick={async (
                event,
              ) => {
                event.preventDefault();

                const destino =
                  event.currentTarget.href;

                await registrarEventoTreinamento(
                  {
                    slug:
                      course.slug,

                    titulo:
                      course.titulo,

                    evento:
                      "curso_click",

                    origem:
                      "/",
                  },
                );

                window.location.href =
                  destino;
              }}
            >
              {/* =====================================
                  IMAGEM
              ====================================== */}

              <div
                className={`course-cover course-cover-${
                  (index % 6) + 1
                }`}
              >
                {course.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      course.imagem_url
                    }
                    alt={
                      course.titulo
                    }
                    className="course-cover-image"
                  />
                ) : (
                  <>
                    <div className="course-visual-icon">
                      {getCourseInitials(
                        course.titulo,
                      )}
                    </div>

                    <div className="course-pattern" />
                  </>
                )}

                {course.destaque && (
                  <span className="course-tag">
                    DESTAQUE
                  </span>
                )}
              </div>

              {/* =====================================
                  CONTEÚDO
              ====================================== */}

              <div className="course-content">

                {/* CATEGORIA REAL DO CURSO */}

                <div className="course-category">
                  {categoria?.nome ||
                    "Treinamento"}
                </div>

                {/* TÍTULO */}

                <h3>
                  {course.titulo}
                </h3>

                {/* DESCRIÇÃO */}

                <p>
                  {course.descricao ||
                    "Conheça este treinamento e desenvolva novas competências para sua carreira profissional."}
                </p>

                {/* INFORMAÇÕES */}

                <div className="course-info">
                  <span>
                    Treinamento profissional
                  </span>

                  <span>
                    •
                  </span>

                  <span>
                    2BSUPPLY
                  </span>
                </div>

                {/* RODAPÉ DO CARD */}

                <div className="course-bottom">
                  <span>
                    Conhecer treinamento
                  </span>

                  <ArrowRightIcon />
                </div>
              </div>
            </Link>
          );
        },
      )}

      {/* =========================================
          CARREGANDO
      ========================================= */}

      {carregandoTreinamentos && (
        <>
          <CourseLoadingCard />

          <CourseLoadingCard />

          <CourseLoadingCard />
        </>
      )}

      {/* =========================================
          SEM TREINAMENTOS
      ========================================= */}

      {!carregandoTreinamentos &&
        treinamentos.length ===
          0 && (
          <div className="courses-empty">
            Nenhum treinamento publicado no momento.
          </div>
        )}
    </div>
  </div>
</section>

      {/* =====================================================
          DIFERENCIAIS
      ====================================================== */}

      <section className="section why-section">
        <div className="container">
          <div className="why-grid">
            <div className="why-intro">
              <span className="section-kicker">
                POR QUE A 2BSUPPLY?
              </span>

              <h2>
                Mais que cursos.
                <br />
                Desenvolvimento para quem faz acontecer.
              </h2>

              <p>
                Conteúdos desenvolvidos para conectar
                conhecimento, prática e estratégia.
              </p>

              <ul>
                <li>
                  <CheckIcon />
                  Conteúdo conectado ao mercado
                </li>

                <li>
                  <CheckIcon />
                  Professores e especialistas experientes
                </li>

                <li>
                  <CheckIcon />
                  Estudos de casos e aplicações práticas
                </li>

                <li>
                  <CheckIcon />
                  Conteúdo atualizado
                </li>

                <li>
                  <CheckIcon />
                  Certificação
                </li>

                <li>
                  <CheckIcon />
                  Desenvolvimento profissional
                </li>
              </ul>
            </div>

            <div className="comparison">
              <div className="comparison-header comparison-row">
                <div />

                <strong className="featured-column">
                  <span>
                   NOSSOS
                  </span>

                  Treinamentos
                </strong>

                <strong>
                  Curso tradicional
                </strong>

                <strong>
                  Conteúdo gratuito
                </strong>
              </div>

              {[
                [
                  "Conteúdo prático",
                  true,
                  "Limitado",
                  false,
                ],
                [
                  "Aplicação no mercado",
                  true,
                  "Parcial",
                  false,
                ],
                [
                  "Especialistas da área",
                  true,
                  "Variável",
                  false,
                ],
                [
                  "Conteúdo atualizado",
                  true,
                  "Variável",
                  "Limitado",
                ],
                [
                  "Certificação",
                  true,
                  true,
                  false,
                ],
                [
                  "Foco em Suprimentos",
                  true,
                  false,
                  false,
                ],
              ].map(
                (
                  item,
                ) => (
                  <div
                    className="comparison-row"
                    key={
                      item[0] as string
                    }
                  >
                    <span>
                      {item[0]}
                    </span>

                    <div className="featured-column">
                      <CheckIcon />
                    </div>

                    <div className="centralizado">
                      {item[2] ===
                      true ? (
                        <CheckIcon />
                      ) : item[2] ===
                        false ? (
                        <CrossIcon />
                      ) : (
                        <small>
                          {item[2]}
                        </small>
                      )}
                    </div>

                    <div className="centralizado">
                      {item[3] ===
                      true ? (
                        <CheckIcon />
                      ) : item[3] ===
                        false ? (
                        <CrossIcon />
                      ) : (
                        <small>
                          {item[3]}
                        </small>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          EMPRESAS
      ====================================================== */}

      <section
        className="section company-section"
        id="empresas"
      >
        <div className="container">
          <div className="company-box">
            <div className="company-content">
              <span className="section-kicker">
                TREINAMENTOS IN COMPANY
              </span>

              <h2>
                Desenvolva sua equipe. Transforme seus
                resultados.
              </h2>

              <p>
                Programas personalizados para empresas que
                desejam desenvolver seus profissionais de
                Compras, Suprimentos e Supply Chain.
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

            <div className="company-features">
              <div>
                <span>
                  01
                </span>

                <strong>
                  Conteúdo personalizado
                </strong>

                <p>
                  Treinamentos adaptados aos desafios da sua
                  organização.
                </p>
              </div>

              <div>
                <span>
                  02
                </span>

                <strong>
                  Online ou presencial
                </strong>

                <p>
                  Formatos flexíveis para atender diferentes
                  equipes.
                </p>
              </div>

              <div>
                <span>
                  03
                </span>

                <strong>
                  Aplicação prática
                </strong>

                <p>
                  Conhecimento conectado à realidade da
                  empresa.
                </p>
              </div>

              <div>
                <span>
                  04
                </span>

                <strong>
                  Especialistas
                </strong>

                <p>
                  Profissionais com sólida experiência em
                  Procurement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DEPOIMENTOS
      ====================================================== */}

      <section
        className="section testimonials-section"
        id="depoimentos"
      >
        <div className="container">
          <div className="section-header testimonials-header">
            <div>
              <span className="section-kicker">
                QUEM APRENDE, EVOLUI
              </span>

              <h2>
                Experiências que geram transformação
              </h2>
            </div>

            {/* SETAS SOMENTE COM MAIS DE 3 DEPOIMENTOS */}

            {testimonials.length > 3 && (
              <div className="testimonials-navigation">
                <button
                  type="button"
                  className="testimonial-arrow"
                  onClick={() =>
                    moverDepoimentos(
                      "prev",
                    )
                  }
                  aria-label="Depoimentos anteriores"
                >
                  <SliderArrowLeftIcon />
                </button>

                <button
                  type="button"
                  className="testimonial-arrow"
                  onClick={() =>
                    moverDepoimentos(
                      "next",
                    )
                  }
                  aria-label="Próximos depoimentos"
                >
                  <SliderArrowRightIcon />
                </button>
              </div>
            )}
          </div>

          {/* CARREGANDO */}

          {carregandoDepoimentos && (
            <div className="testimonials-loading">
              Carregando depoimentos...
            </div>
          )}

          {/* =================================================
              ATÉ 3 = GRID NORMAL
          ================================================== */}

          {!carregandoDepoimentos &&
            testimonials.length >
              0 &&
            testimonials.length <=
              3 && (
              <div className="testimonials-grid">
                {testimonials.map(
                  (
                    testimonial,
                  ) => (
                    <TestimonialCard
                      key={
                        testimonial.id
                      }
                      testimonial={
                        testimonial
                      }
                    />
                  ),
                )}
              </div>
            )}

          {/* =================================================
              4 OU MAIS = SLIDER
          ================================================== */}

          {!carregandoDepoimentos &&
            testimonials.length >
              3 && (
              <div className="testimonials-slider-wrapper">
                <div
                  ref={
                    testimonialsSliderRef
                  }
                  className="testimonials-slider"
                >
                  {testimonials.map(
                    (
                      testimonial,
                    ) => (
                      <TestimonialCard
                        key={
                          testimonial.id
                        }
                        testimonial={
                          testimonial
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            )}

          {/* SEM DEPOIMENTOS */}

          {!carregandoDepoimentos &&
            testimonials.length ===
              0 && (
              <div className="testimonials-loading">
                Nenhum depoimento cadastrado no momento.
              </div>
            )}
        </div>
      </section>

      {/* =====================================================
          NEWSLETTER
      ====================================================== */}

      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter">
            <div>
              <span className="section-kicker">
                CONTEÚDO E CONHECIMENTO
              </span>

              <h2>
                Continue evoluindo.
              </h2>

              <p>
                Receba novidades, conteúdos e informações
                sobre novos treinamentos da 2BSUPPLY.
              </p>
            </div>

            <form
              className="newsletter-form"
              onSubmit={
                handleNewsletterSubmit
              }
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                position: "relative",
              }}
            >
              {/* NOME */}

              <input
                type="text"
                value={
                  newsletterNome
                }
                onChange={(
                  event,
                ) =>
                  setNewsletterNome(
                    event.target.value,
                  )
                }
                placeholder="Seu nome"
                aria-label="Seu nome"
                autoComplete="name"
                disabled={
                  enviandoNewsletter
                }
                style={{
                  flex: "1 1 150px",
                  width: "auto",
                  minWidth: "0",
                  padding:
                    "0 18px",
                }}
              />

              {/* E-MAIL */}

              <input
                type="email"
                value={
                  newsletterEmail
                }
                onChange={(
                  event,
                ) =>
                  setNewsletterEmail(
                    event.target.value,
                  )
                }
                placeholder="Informe seu e-mail"
                aria-label="Informe seu e-mail"
                autoComplete="email"
                disabled={
                  enviandoNewsletter
                }
                style={{
                  flex: "2 1 210px",
                  width: "auto",
                  minWidth: "0",
                  padding:
                    "0 18px",
                }}
              />

              {/* BOTÃO */}

              <button
                type="submit"
                aria-label="Cadastrar na newsletter"
                disabled={
                  enviandoNewsletter
                }
                style={{
                  position: "static",
                  flex: "0 0 55px",
                  width: "55px",
                  height: "55px",
                  opacity:
                    enviandoNewsletter
                      ? 0.65
                      : 1,
                  cursor:
                    enviandoNewsletter
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {enviandoNewsletter ? (
                  <NewsletterLoadingIcon />
                ) : (
                  <ArrowRightIcon />
                )}
              </button>

              {/* MENSAGEM */}

              {newsletterMessage && (
                <div
                  role={
                    newsletterMessageType ===
                    "error"
                      ? "alert"
                      : "status"
                  }
                  style={{
                    flexBasis:
                      "100%",

                    marginTop:
                      "2px",

                    fontSize:
                      "14px",

                    fontWeight: 
                      "300",

                    lineHeight:
                      "1.5",

                    color:
                      newsletterMessageType ===
                      "success"
                        ? "#22c55e"
                        : "#f35e5e",
                  }}
                >
                  {
                    newsletterMessage
                  }
                </div>
              )}
            </form>
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
   CARD DE DEPOIMENTO
========================================================= */

function TestimonialCard({
  testimonial,
}: {
  testimonial: Testimonial;
}) {
  const iniciais =
    getPersonInitials(
      testimonial.nome,
    );

  const estrelas =
    Math.min(
      5,
      Math.max(
        1,
        Number(
          testimonial.estrelas,
        ) || 5,
      ),
    );

  return (
    <article className="testimonial-card">
      <div className="quote">
        “
      </div>

      {/* ESTRELAS */}

      <div
        className="testimonial-stars"
        aria-label={`${estrelas} de 5 estrelas`}
      >
        {[
          1,
          2,
          3,
          4,
          5,
        ].map(
          (
            estrela,
          ) => (
            <StarIcon
              key={estrela}
              active={
                estrela <=
                estrelas
              }
            />
          ),
        )}
      </div>

      {/* DEPOIMENTO */}

      <p>
        {
          testimonial.depoimento
        }
      </p>

      {/* PESSOA */}

      <div className="testimonial-person">
        {testimonial.foto_url ? (
          <div className="avatar testimonial-avatar-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                testimonial.foto_url
              }
              alt={
                testimonial.nome
              }
            />
          </div>
        ) : (
          <div className="avatar">
            {iniciais}
          </div>
        )}

        <div>
          <strong>
            {testimonial.nome}
          </strong>

          <span>
            {testimonial.cargo}
          </span>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   LOADING CARD
========================================================= */

function CourseLoadingCard() {
  return (
    <div className="course-card course-card-loading">
      <div className="course-cover" />

      <div className="course-content">
        <div className="course-loading-line course-loading-small" />

        <div className="course-loading-line course-loading-title" />

        <div className="course-loading-line" />

        <div className="course-loading-line" />
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getCourseInitials(
  title: string,
) {
  const words = title
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (
    words.length === 0
  ) {
    return "2B";
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .substring(
        0,
        2,
      )
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[1][0]
  ).toUpperCase();
}

function getPersonInitials(
  name: string,
) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (
    words.length === 0
  ) {
    return "?";
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .substring(
        0,
        2,
      )
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[
      words.length - 1
    ][0]
  ).toUpperCase();
}

/* =========================================================
   ÍCONES
========================================================= */

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SliderArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function SliderArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="check-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12.5l4 4L19 7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      className="cross-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h6v6H4z" />

      <path d="M14 4h6v6h-6z" />

      <path d="M4 14h6v6H4z" />

      <path d="M14 14h6v6h-6z" />
    </svg>
  );
}

function StarIcon({
  active,
}: {
  active: boolean;
}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={
        active
          ? "#fbbf24"
          : "transparent"
      }
      stroke={
        active
          ? "#fbbf24"
          : "#526174"
      }
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 2.8 2.84 5.76 6.36.93-4.6 4.48 1.09 6.33L12 17.31 6.31 20.3l1.09-6.33-4.6-4.48 6.36-.93L12 2.8Z" />
    </svg>
  );
}

function NewsletterLoadingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        width: "19px",
        height: "19px",
        animation:
          "newsletterSpin 0.8s linear infinite",
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.25"
      />

      <path
        d="M20 12a8 8 0 0 0-8-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}