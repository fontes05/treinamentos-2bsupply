"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

import "./FloatingAssistant.css";

/* =========================================================
   TIPOS
========================================================= */

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;

  objective: string;
  target_audience: string;
  learning: string;
  benefits: string;
  competencies: string;
  methodology: string;
  certification: string;
  expected_result: string;

  link_curso_saiba_mais: string;
  link_curso_pagamento: string;
};

type ChatMessage = {
  type: "assistant" | "user";
  text: string;
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function FloatingAssistant() {
  /* =======================================================
     ABERTO / FECHADO
  ======================================================= */

  const [isOpen, setIsOpen] =
    useState(false);

  /* =======================================================
     CURSOS
  ======================================================= */

  const [courses, setCourses] =
    useState<Course[]>([]);

  const [
    loadingCourses,
    setLoadingCourses,
  ] = useState(true);

  const [
    coursesError,
    setCoursesError,
  ] = useState("");

  /* =======================================================
     OUTRO ASSUNTO
  ======================================================= */

  const [
    otherSubject,
    setOtherSubject,
  ] = useState("");

  const [
    showOtherInput,
    setShowOtherInput,
  ] = useState(false);

  /* =======================================================
     CHAT
  ======================================================= */

  const [showChat, setShowChat] =
    useState(false);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  /* =======================================================
     RESULTADOS
  ======================================================= */

  const [
    matchedCourses,
    setMatchedCourses,
  ] = useState<Course[]>([]);

  const [
    currentCourseIndex,
    setCurrentCourseIndex,
  ] = useState(0);

  const [
    recommendedCourse,
    setRecommendedCourse,
  ] = useState<Course | null>(
    null,
  );

  const [
    showCourseDetails,
    setShowCourseDetails,
  ] = useState(false);

  const [
    showCourseActions,
    setShowCourseActions,
  ] = useState(false);

  /* =======================================================
     FESTA / RETORNO
  ======================================================= */

  const [
    showCelebration,
    setShowCelebration,
  ] = useState(false);

  /*
   * Fica true quando o usuário
   * clica em:
   *
   * - Mais informações
   * - Ir para pagamento
   */
  const waitingReturnRef =
    useRef(false);

  /*
   * Confirma que o usuário
   * saiu da aba.
   */
  const leftPageRef =
    useRef(false);

  /* =======================================================
     CARREGA OS CURSOS DO SUPABASE
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadCourses() {
      setLoadingCourses(true);

      setCoursesError("");

      try {
        const supabase =
          createClient();

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
            imagem_url,
            publico_alvo,
            porque_aprender,
            objetivo_geral,
            beneficios_curso,
            competencias_desenvolvidas,
            metodologia_aprendizagem,
            avaliacao_certificacao,
            resultado_esperado,
            link_inscricao,
            status,
            ordem
          `)
          .eq(
            "status",
            "publicado",
          )
          .order(
            "ordem",
            {
              ascending: true,
            },
          )
          .order(
            "titulo",
            {
              ascending: true,
            },
          );

        if (error) {
          throw error;
        }

        if (!mounted) {
          return;
        }

        const formattedCourses: Course[] =
          (data ?? []).map(
            (course) => ({
              id: String(
                course.id,
              ),

              title:
                course.titulo ??
                "",

              slug:
                course.slug ??
                "",

              description:
                course.descricao ??
                "",

              image:
                course.imagem_url ??
                "",

              objective:
                course.objetivo_geral ??
                "",

              target_audience:
                course.publico_alvo ??
                "",

              learning:
                course.porque_aprender ??
                "",

              benefits:
                course.beneficios_curso ??
                "",

              competencies:
                course.competencias_desenvolvidas ??
                "",

              methodology:
                course.metodologia_aprendizagem ??
                "",

              certification:
                course.avaliacao_certificacao ??
                "",

              expected_result:
                course.resultado_esperado ??
                "",

              /*
               * Página interna
               * do treinamento.
               */
              link_curso_saiba_mais:
                course.slug
                  ? `/cursos/${course.slug}`
                  : "",

              /*
               * Link de inscrição /
               * pagamento cadastrado
               * no Supabase.
               */
              link_curso_pagamento:
                course.link_inscricao ??
                "",
            }),
          );

        setCourses(
          formattedCourses,
        );
      } catch (error) {
        console.error(
          "Erro ao carregar cursos do Supabase:",
          error,
        );

        if (!mounted) {
          return;
        }

        setCourses([]);

        setCoursesError(
          "Não consegui carregar os treinamentos agora. Tente novamente em alguns instantes.",
        );
      } finally {
        if (mounted) {
          setLoadingCourses(
            false,
          );
        }
      }
    }

    loadCourses();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     DETECTA RETORNO DO USUÁRIO

     Clicou em um link
     ↓

     Vai para outra aba
     ↓

     Retorna
     ↓

     Robô festa.jpg
  ======================================================= */

  useEffect(() => {
    function handleBlur() {
      if (
        waitingReturnRef.current
      ) {
        leftPageRef.current =
          true;
      }
    }

    function handleFocus() {
      if (
        !waitingReturnRef.current
      ) {
        return;
      }

      if (
        !leftPageRef.current
      ) {
        return;
      }

      waitingReturnRef.current =
        false;

      leftPageRef.current =
        false;

      setIsOpen(false);

      setShowCelebration(
        true,
      );
    }

    window.addEventListener(
      "blur",
      handleBlur,
    );

    window.addEventListener(
      "focus",
      handleFocus,
    );

    return () => {
      window.removeEventListener(
        "blur",
        handleBlur,
      );

      window.removeEventListener(
        "focus",
        handleFocus,
      );
    };
  }, []);

  /* =======================================================
     LIMPA HTML
  ======================================================= */

  function cleanHtml(
    text: string,
  ) {
    if (!text) {
      return "";
    }

    const temp =
      document.createElement(
        "div",
      );

    temp.innerHTML =
      text;

    return (
      temp.textContent ||
      temp.innerText ||
      ""
    );
  }

  /* =======================================================
     NORMALIZA TEXTO

     Ex:
     inteligência
     inteligencia

     ficam equivalentes.
  ======================================================= */

  function normalizeText(
    text: string,
  ) {
    return cleanHtml(
      text || "",
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .toLowerCase()
      .trim();
  }

  /* =======================================================
     BUSCA CURSOS RELACIONADOS
  ======================================================= */

  function findCoursesBySubject(
    subject: string,
  ): Course[] {
    const normalizedSubject =
      normalizeText(
        subject,
      );

    if (
      !normalizedSubject
    ) {
      return [];
    }

    const words =
      normalizedSubject
        .split(/\s+/)
        .map(
          (word) =>
            word.trim(),
        )
        .filter(
          (word) =>
            word.length >=
            3,
        );

    const scoredCourses =
      courses.map(
        (course) => {
          const title =
            normalizeText(
              course.title,
            );

          /*
           * Tudo isso passa
           * a ser pesquisável.
           */
          const searchableText =
            normalizeText(
              [
                course.title,
                course.description,
                course.objective,
                course.target_audience,
                course.learning,
                course.benefits,
                course.competencies,
                course.methodology,
                course.certification,
                course.expected_result,
              ].join(
                " ",
              ),
            );

          let score = 0;

          /*
           * Expressão encontrada
           * no título.
           */
          if (
            title.includes(
              normalizedSubject,
            )
          ) {
            score += 100;
          }

          /*
           * Expressão completa
           * encontrada no conteúdo.
           */
          if (
            searchableText.includes(
              normalizedSubject,
            )
          ) {
            score += 50;
          }

          /*
           * Busca pelas palavras
           * separadamente.
           */
          words.forEach(
            (word) => {
              if (
                title.includes(
                  word,
                )
              ) {
                score += 20;

                return;
              }

              if (
                searchableText.includes(
                  word,
                )
              ) {
                score += 10;
              }
            },
          );

          return {
            course,
            score,
          };
        },
      );

    return scoredCourses
      .filter(
        (item) =>
          item.score > 0,
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      )
      .map(
        (item) =>
          item.course,
      );
  }

  /* =======================================================
     MOSTRA UM CURSO
  ======================================================= */

  function showCourse(
    course: Course,
    index: number,
    allCourses: Course[],
    subject: string,
  ) {
    setMatchedCourses(
      allCourses,
    );

    setCurrentCourseIndex(
      index,
    );

    setRecommendedCourse(
      course,
    );

    setShowCourseDetails(
      false,
    );

    setShowCourseActions(
      false,
    );

    setMessages([
      {
        type: "user",
        text: subject,
      },
      {
        type:
          "assistant",
        text: "",
      },
    ]);

    setShowChat(true);
  }

  /* =======================================================
     SELECIONA ASSUNTO
  ======================================================= */

  function handleCategory(
    category: string,
  ) {
    if (
      loadingCourses
    ) {
      return;
    }

    const foundCourses =
      findCoursesBySubject(
        category,
      );

    if (
      foundCourses.length >
      0
    ) {
      showCourse(
        foundCourses[0],
        0,
        foundCourses,
        category,
      );

      return;
    }

    setMatchedCourses([]);

    setCurrentCourseIndex(
      0,
    );

    setRecommendedCourse(
      null,
    );

    setShowCourseDetails(
      false,
    );

    setShowCourseActions(
      false,
    );

    setMessages([
      {
        type: "user",
        text: category,
      },
      {
        type:
          "assistant",
        text:
          "Ainda não encontrei um curso específico para esse assunto. Mas posso ajudar você a procurar outra opção.",
      },
    ]);

    setShowChat(true);
  }

  /* =======================================================
     OUTRO ASSUNTO
  ======================================================= */

  function handleOtherSubject() {
    const subject =
      otherSubject.trim();

    if (!subject) {
      return;
    }

    handleCategory(
      subject,
    );
  }

  /* =======================================================
     USUÁRIO TEM INTERESSE
  ======================================================= */

  function handleCourseInterest() {
    if (
      !recommendedCourse
    ) {
      return;
    }

    setShowCourseDetails(
      true,
    );

    setShowCourseActions(
      false,
    );

    setMessages(
      (current) => [
        ...current,
        {
          type: "user",
          text:
            "Sim, tenho interesse.",
        },
        {
          type:
            "assistant",
          text:
            "Ótima escolha! Veja algumas informações sobre este curso:",
        },
      ],
    );
  }

  /* =======================================================
     QUER CONHECER
  ======================================================= */

  function handleYes() {
    if (
      !recommendedCourse
    ) {
      return;
    }

    setShowCourseActions(
      true,
    );

    setMessages(
      (current) => [
        ...current,
        {
          type: "user",
          text:
            "Sim, quero conhecer.",
        },
        {
          type:
            "assistant",
          text:
            "Como você prefere continuar?",
        },
      ],
    );
  }

  /* =======================================================
     NÃO - MOSTRAR PRÓXIMO CURSO
  ======================================================= */

  function handleNo() {
    const nextIndex =
      currentCourseIndex +
      1;

    if (
      nextIndex <
      matchedCourses.length
    ) {
      const nextCourse =
        matchedCourses[
          nextIndex
        ];

      setCurrentCourseIndex(
        nextIndex,
      );

      setRecommendedCourse(
        nextCourse,
      );

      setShowCourseDetails(
        false,
      );

      setShowCourseActions(
        false,
      );

      setMessages(
        (current) => [
          ...current,
          {
            type: "user",
            text:
              "Não, quero ver outra opção.",
          },
          {
            type:
              "assistant",
            text:
              "Sem problema! Veja outra opção que pode fazer sentido para você.",
          },
        ],
      );

      return;
    }

    /*
     * Não existem mais
     * cursos correspondentes.
     */

    setRecommendedCourse(
      null,
    );

    setMatchedCourses([]);

    setCurrentCourseIndex(
      0,
    );

    setShowCourseDetails(
      false,
    );

    setShowCourseActions(
      false,
    );

    setOtherSubject("");

    setShowOtherInput(
      true,
    );

    setShowChat(false);

    setMessages([]);
  }

  /* =======================================================
     PREPARA CLIQUE EM LINK
  ======================================================= */

  function prepareNavigation() {
    waitingReturnRef.current =
      true;

    leftPageRef.current =
      false;

    setShowCelebration(
      false,
    );

    /*
     * Fecha a janela
     * do robô.
     */
    setIsOpen(false);
  }

  /* =======================================================
     MAIS INFORMAÇÕES
  ======================================================= */

  function handleCourseInfo() {
    const link =
      recommendedCourse
        ?.link_curso_saiba_mais;

    if (!link) {
      return;
    }

    prepareNavigation();

    window.open(
      link,
      "_blank",
      "noopener,noreferrer",
    );
  }

  /* =======================================================
     PAGAMENTO / INSCRIÇÃO
  ======================================================= */

  function handlePayment() {
    const link =
      recommendedCourse
        ?.link_curso_pagamento;

    if (!link) {
      return;
    }

    prepareNavigation();

    window.open(
      link,
      "_blank",
      "noopener,noreferrer",
    );
  }

  /* =======================================================
     VOLTAR PARA O INÍCIO
  ======================================================= */

  function handleBack() {
    setShowOtherInput(
      false,
    );

    setOtherSubject("");

    setRecommendedCourse(
      null,
    );

    setMatchedCourses([]);

    setCurrentCourseIndex(
      0,
    );

    setShowCourseDetails(
      false,
    );

    setShowCourseActions(
      false,
    );

    setMessages([]);

    setShowChat(false);
  }

  /* =======================================================
     ABRIR / FECHAR
  ======================================================= */

  function handleToggleAssistant() {
    /*
     * Está aberto:
     * fecha.
     */
    if (isOpen) {
      setIsOpen(false);

      return;
    }

    /*
     * Se estava comemorando,
     * ao abrir volta para
     * sorrindo.
     */
    setShowCelebration(
      false,
    );

    setIsOpen(true);
  }

  /* =======================================================
     IMAGEM DO ROBÔ
  ======================================================= */

  const robotImage =
    isOpen
      ? "/robot/sorrindo.jpg"
      : showCelebration
        ? "/robot/festa.jpg"
        : "/robot/fechado.jpg";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={`twobs-assistant ${
        isOpen
          ? "twobs-assistant-open"
          : "twobs-assistant-closed"
      }`}
    >
      {/* ==================================================
          JANELA DO ASSISTENTE
      ================================================== */}

      {isOpen && (
        <div className="twobs-assistant-window">
          {/* ==============================================
              HEADER
          ============================================== */}

          <div className="twobs-assistant-header">
            <div>
              <strong>
                Eu sabia que
                você estava
                com dúvida!
              </strong>

              <span>
                Mas que bom
                que eu estou
                aqui para
                ajudar você a
                encontrar o
                curso ideal
                para o seu
                momento!
              </span>
            </div>

            <button
              type="button"
              className="twobs-assistant-close-button"
              onClick={() =>
                setIsOpen(
                  false,
                )
              }
              aria-label="Fechar assistente"
            >
              ×
            </button>
          </div>

          {/* ==============================================
              OPÇÕES INICIAIS
          ============================================== */}

          {!showChat &&
            !showOtherInput && (
              <div className="twobs-assistant-content">
                <p>
                  Qual assunto
                  você gostaria
                  de conhecer
                  melhor?
                </p>

                {loadingCourses && (
                  <p>
                    Carregando
                    treinamentos...
                  </p>
                )}

                {coursesError && (
                  <p>
                    {
                      coursesError
                    }
                  </p>
                )}

                <button
                  type="button"
                  className="twobs-assistant-option"
                  onClick={() =>
                    handleCategory(
                      "gestão",
                    )
                  }
                  disabled={
                    loadingCourses
                  }
                >
                  Gestão
                </button>

                <button
                  type="button"
                  className="twobs-assistant-option"
                  onClick={() =>
                    handleCategory(
                      "suprimentos",
                    )
                  }
                  disabled={
                    loadingCourses
                  }
                >
                  Suprimentos
                </button>

                <button
                  type="button"
                  className="twobs-assistant-option"
                  onClick={() =>
                    handleCategory(
                      "compras",
                    )
                  }
                  disabled={
                    loadingCourses
                  }
                >
                  Compras
                </button>

                <button
                  type="button"
                  className="twobs-assistant-option"
                  onClick={() =>
                    handleCategory(
                      "inteligência artificial",
                    )
                  }
                  disabled={
                    loadingCourses
                  }
                >
                  Inteligência
                  Artificial
                </button>

                <button
                  type="button"
                  className="twobs-assistant-option"
                  onClick={() =>
                    setShowOtherInput(
                      true,
                    )
                  }
                  disabled={
                    loadingCourses
                  }
                >
                  Outros
                  assuntos
                </button>
              </div>
            )}

          {/* ==============================================
              OUTRO ASSUNTO
          ============================================== */}

          {showOtherInput &&
            !showChat && (
              <div className="twobs-assistant-content">
                <p>
                  Sobre qual
                  assunto você
                  gostaria de
                  conversar?
                </p>

                <input
                  type="text"
                  className="twobs-assistant-input"
                  value={
                    otherSubject
                  }
                  onChange={(
                    event,
                  ) =>
                    setOtherSubject(
                      event
                        .target
                        .value,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      handleOtherSubject();
                    }
                  }}
                  placeholder="Digite o assunto..."
                  autoFocus
                />

                <button
                  type="button"
                  className="twobs-assistant-send"
                  onClick={
                    handleOtherSubject
                  }
                  disabled={
                    !otherSubject.trim() ||
                    loadingCourses
                  }
                >
                  Enviar
                </button>

                <button
                  type="button"
                  className="twobs-assistant-back"
                  onClick={
                    handleBack
                  }
                >
                  ← Voltar
                </button>
              </div>
            )}

          {/* ==============================================
              CHAT
          ============================================== */}

          {showChat && (
            <div className="twobs-assistant-chat">
              <div className="twobs-chat-messages">
                {/* ========================================
                    MENSAGENS
                ======================================== */}

                {messages.map(
                  (
                    message,
                    index,
                  ) =>
                    message.text ? (
                      <div
                        key={`${message.type}-${index}`}
                        className={`twobs-chat-message ${
                          message.type ===
                          "user"
                            ? "twobs-user-message"
                            : "twobs-assistant-message"
                        }`}
                      >
                        {
                          message.text
                        }
                      </div>
                    ) : null,
                )}

                {/* ========================================
                    CURSO RECOMENDADO
                ======================================== */}

                {recommendedCourse && (
                  <>
                    {/* ====================================
                        PRIMEIRA ETAPA
                    ==================================== */}

                    {!showCourseDetails &&
                      !showCourseActions && (
                        <>
                          <div className="twobs-course-preview">
                            {recommendedCourse.image && (
                              <img
                                src={
                                  recommendedCourse.image
                                }
                                alt={
                                  recommendedCourse.title
                                }
                              />
                            )}

                            <strong>
                              {
                                recommendedCourse.title
                              }
                            </strong>

                            <p>
                              Você
                              tem
                              interesse
                              nesse
                              curso?
                            </p>
                          </div>

                          <div className="twobs-assistant-actions">
                            <button
                              type="button"
                              className="twobs-assistant-option"
                              onClick={
                                handleCourseInterest
                              }
                            >
                              Sim
                            </button>

                            <button
                              type="button"
                              className="twobs-assistant-option"
                              onClick={
                                handleNo
                              }
                            >
                              Não,
                              quero
                              ver
                              outra
                              opção
                            </button>
                          </div>
                        </>
                      )}

                    {/* ====================================
                        DETALHES DO CURSO
                    ==================================== */}

                    {showCourseDetails &&
                      !showCourseActions && (
                        <>
                          <div className="twobs-course-details">
                            <strong>
                              Sobre
                              o curso
                            </strong>

                            <p>
                              {cleanHtml(
                                recommendedCourse.description,
                              ) ||
                                "Conheça este treinamento da 2BSUPPLY."}
                            </p>

                            <strong>
                              Para
                              quem é?
                            </strong>

                            <p>
                              {cleanHtml(
                                recommendedCourse.target_audience,
                              ) ||
                                "Consulte os detalhes completos do treinamento para conhecer o público recomendado."}
                            </p>
                          </div>

                          <div className="twobs-assistant-actions">
                            <button
                              type="button"
                              className="twobs-assistant-option"
                              onClick={
                                handleYes
                              }
                            >
                              Sim,
                              quero
                              conhecer
                            </button>

                            <button
                              type="button"
                              className="twobs-assistant-option"
                              onClick={
                                handleNo
                              }
                            >
                              Não,
                              quero
                              ver
                              outra
                              opção
                            </button>
                          </div>
                        </>
                      )}

                    {/* ====================================
                        AÇÕES
                    ==================================== */}

                    {showCourseActions && (
                      <div className="twobs-assistant-actions">
                        <button
                          type="button"
                          className="twobs-assistant-option"
                          onClick={
                            handleCourseInfo
                          }
                          disabled={
                            !recommendedCourse.link_curso_saiba_mais
                          }
                        >
                          Quero
                          mais
                          informações
                          do curso
                        </button>

                        <button
                          type="button"
                          className="twobs-assistant-option"
                          onClick={
                            handlePayment
                          }
                          disabled={
                            !recommendedCourse.link_curso_pagamento
                          }
                        >
                          Ir para
                          o
                          pagamento
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ==========================================
                  VOLTAR
              ========================================== */}

              <button
                type="button"
                className="twobs-assistant-back"
                onClick={
                  handleBack
                }
              >
                ← Voltar
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          MENSAGEM COM CHAT FECHADO
      ================================================== */}

      {!isOpen && (
        <div className="twobs-assistant-message">
          {showCelebration ? (
            <>
              <strong>
                Que bom que
                eu te ajudei!
              </strong>

              <span>
                Se precisar
                de outros
                cursos, é só
                voltar aqui.
              </span>
            </>
          ) : (
            "Procurando o curso ideal?"
          )}
        </div>
      )}

      {/* ==================================================
          ROBÔ
      ================================================== */}

      <button
        type="button"
        className="twobs-assistant-avatar"
        onClick={
          handleToggleAssistant
        }
        aria-label={
          isOpen
            ? "Fechar assistente"
            : "Abrir assistente"
        }
        style={{
          background:
            "transparent",
          border: 0,
        }}
      >
        <img
          src={robotImage}
          alt="Assistente 2BSUPPLY"
        />
      </button>
    </div>
  );
}