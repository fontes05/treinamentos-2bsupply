"use client";

import Image from "next/image";
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
  ativo: boolean;
};

type TreinamentoHome = {
  id: string;
  titulo: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  destaque: boolean;
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
              destaque
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
          .limit(6);

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
          <Image
            src="/hero-treinamentos.jpg"
            alt="Tecnologia e inteligência artificial aplicada aos treinamentos 2BSUPPLY"
            fill
            priority
            className="hero-background-image"
            sizes="100vw"
          />

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
                href="/todos"
                className="primary-button"
              >
                Explorar treinamentos

                <ArrowRightIcon />
              </Link>

              <a
                href="#empresas"
                className="secondary-button"
              >
                Treinamentos para empresas
              </a>
            </div>
          </div>
        </div>

        {/* CATEGORIAS */}

        <div
          className="container hero-categories"
          id="areas"
        >
          <div className="categories">
            {categories.map(
              (category) => (
                <Link
                  href={`/todos?categoria=${encodeURIComponent(
                    category.slug,
                  )}`}
                  className="category-card"
                  key={category.id}
                >
                  <div className="category-icon">
                    <CategoryIcon />
                  </div>

                  <div>
                    <strong>
                      {category.nome}
                    </strong>

                    <span>
                      {category.descricao ||
                        "Ver treinamentos"}
                    </span>
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
              href="/todos"
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
              ) => (
                <Link
                  href={`/${course.slug}`}
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

                  <div className="course-content">
                    <div className="course-category">
                      2BSUPPLY ACADEMY
                    </div>

                    <h3>
                      {course.titulo}
                    </h3>

                    <p>
                      {course.descricao ||
                        "Conheça este treinamento e desenvolva novas competências para sua carreira profissional."}
                    </p>

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

                    <div className="course-bottom">
                      <span>
                        Conhecer treinamento
                      </span>

                      <ArrowRightIcon />
                    </div>
                  </div>
                </Link>
              ),
            )}

            {carregandoTreinamentos && (
              <>
                <CourseLoadingCard />

                <CourseLoadingCard />

                <CourseLoadingCard />
              </>
            )}

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
                    2BSUPPLY
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
                href="/contato"
                className="primary-button"
              >
                Falar com um especialista

                <ArrowRightIcon />
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