"use client";

import Link from "next/link";

import {
  type ElementType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Clock,
  Eye,
  Globe2,
  GraduationCap,
  LoaderCircle,
  MousePointerClick,
  Network,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* =========================================================
   TIPOS - DASHBOARD
========================================================= */

type RelatorioDashboardRPC = {
  curso_slug: string | null;
  curso_titulo: string | null;

  cliques_curso:
    | number
    | string
    | null;

  cliques_inscricao:
    | number
    | string
    | null;

  cliques_previa:
    | number
    | string
    | null;
};

type Curso = {
  id: string;
  titulo: string;
  slug: string;

  categoria_id:
    | number
    | null;

  status: string;
  destaque: boolean;
  created_at: string;
};

type Categoria = {
  id: number;
  nome: string;
};

type CursoVisitado = {
  titulo: string;
  slug: string;
  categoria: string;
  visitas: number;
  status: string;
};

type UltimaInscricao = {
  titulo: string;
  slug: string;
  created_at: string;
};

type Metricas = {
  inscricoes: number;
  visitas: number;
  previas: number;
};

type GraficoInscricao = {
  key: string;
  mes: string;
  inscricoes: number;
};

/* =========================================================
   TIPOS - GOOGLE ANALYTICS
========================================================= */

type AnalyticsOrigem = {
  origem: string;
  visitantes: number;
  sessoes: number;
  percentual: number;
};

type AnalyticsCanal = {
  canal: string;

  origem: string;

  origemOriginal: string;

  midia: string;

  origemMidia: string;

  sessoes: number;
};

type AnalyticsDesempenhoOrigem = {
  origem: string;
  visitantes: number;
  cursosVistos: number;
};

type AnalyticsDashboard = {
  resumo: {
    visitantes: number;
    sessoes: number;
    visualizacoes: number;
  };

  origens:
    AnalyticsOrigem[];

  canais:
    AnalyticsCanal[];

  desempenhoPorOrigem:
    AnalyticsDesempenhoOrigem[];
};

const ANALYTICS_VAZIO: AnalyticsDashboard = {
  resumo: {
    visitantes: 0,
    sessoes: 0,
    visualizacoes: 0,
  },

  origens: [],

  canais: [],

  desempenhoPorOrigem: [],
};

/* =========================================================
   HELPERS
========================================================= */

function formatarNumero(
  value: number
) {
  return new Intl.NumberFormat(
    "pt-BR"
  ).format(value);
}

/* =========================================================
   FORMATAR ORIGEM GA4
========================================================= */

function formatarOrigemResumoGA4(
  origem: string
) {
  const valor =
    origem
      ?.trim()
      .toLowerCase();

  if (
    valor ===
      "não identificado" ||
    valor ===
      "(not set)" ||
    valor ===
      "not set"
  ) {
    return {
      nome:
        "Origem não identificada",

      descricao:
        "O GA4 não conseguiu determinar a origem",
    };
  }

  if (
    valor ===
      "(data not available)" ||
    valor ===
      "data not available"
  ) {
    return {
      nome:
        "Dados de origem indisponíveis",

      descricao:
        "O Google não disponibilizou a origem desta sessão",
    };
  }

  return {
    nome:
      origem,

    descricao:
      "",
  };
}

/* =========================================================
   HELPERS - CANAIS GA4
========================================================= */

const NOMES_CANAIS_GA4: Record<string, string> = {
  Direct: "Direto",
  "Organic Search": "Busca orgânica",
  "Paid Search": "Busca paga",
  "Organic Social": "Social orgânico",
  "Paid Social": "Social pago",
  Referral: "Referência",
  "Cross-network": "Campanhas multicanal",
  Email: "E-mail",
  Affiliates: "Afiliados",
  Display: "Display",
  "Organic Video": "Vídeo orgânico",
  "Paid Video": "Vídeo pago",
  Audio: "Áudio",
  SMS: "SMS",
  Unassigned: "Não identificado",
};

function traduzirCanalGA4(canal: string) {
  return NOMES_CANAIS_GA4[canal] ?? canal;
}

function dadoGA4Disponivel(
  value: string | null | undefined
) {
  if (!value) return false;

  const normalizado = value
    .trim()
    .toLowerCase();

  return ![
    "(not set)",
    "(data not available)",
    "not set",
    "data not available",
    "undefined",
    "null",
  ].includes(normalizado);
}

function formatarOrigemMidiaGA4(
  item: AnalyticsCanal
) {
  const origem =
    dadoGA4Disponivel(
      item.origemOriginal
    )
      ? item.origemOriginal
      : dadoGA4Disponivel(
            item.origem
          )
        ? item.origem
        : null;

  /* DIRETO */

  if (
    item.canal === "Direct"
  ) {
    return "Acesso direto ao site";
  }

  /* SEM ORIGEM IDENTIFICADA */

  if (!origem) {
    return "Origem não identificada pelo GA4";
  }

  /* LIMPEZA DE ORIGENS */

  const origemNormalizada =
    origem.toLowerCase();

  if (
    origemNormalizada.includes(
      "linkedin"
    )
  ) {
    return "LinkedIn";
  }

  if (
    origemNormalizada.includes(
      "instagram"
    )
  ) {
    return "Instagram";
  }

  if (
    origemNormalizada.includes(
      "facebook"
    )
  ) {
    return "Facebook";
  }

  if (
    origemNormalizada.includes(
      "youtube"
    )
  ) {
    return "YouTube";
  }

  if (
    origemNormalizada.includes(
      "whatsapp"
    )
  ) {
    return "WhatsApp";
  }

  return origem;
}

/* =========================================================
   DATAS
========================================================= */

function getDateInputSaoPaulo(
  date: Date
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(date);

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type === "day"
    )?.value ?? "";

  return `${year}-${month}-${day}`;
}

function dataInicioISO(
  value: string
) {
  return new Date(
    `${value}T00:00:00-03:00`
  ).toISOString();
}

function dataFimISO(
  value: string
) {
  return new Date(
    `${value}T23:59:59.999-03:00`
  ).toISOString();
}

/* =========================================================
   FORMATAR DATAS
========================================================= */

function formatarData(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(value)
  );
}

function formatarDataHora(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",

      timeZone:
        "America/Sao_Paulo",
    }
  ).format(
    new Date(value)
  );
}

function formatarDataCurta(
  value: string
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",

      timeZone:
        "America/Sao_Paulo",
    }
  )
    .format(
      new Date(value)
    )
    .replace(
      ".",
      ""
    );
}

/* =========================================================
   ÚLTIMOS 6 MESES
========================================================= */

function gerarUltimosSeisMeses() {
  const agora =
    new Date();

  const hoje =
    getDateInputSaoPaulo(
      agora
    );

  const [
    anoAtualString,
    mesAtualString,
  ] =
    hoje.split("-");

  const anoAtual =
    Number(
      anoAtualString
    );

  const mesAtual =
    Number(
      mesAtualString
    );

  return Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const referencia =
        new Date(
          Date.UTC(
            anoAtual,
            mesAtual -
              1 -
              (5 - index),
            1,
            12
          )
        );

      const ano =
        referencia.getUTCFullYear();

      const mesNumero =
        referencia.getUTCMonth() +
        1;

      const mesString =
        String(
          mesNumero
        ).padStart(
          2,
          "0"
        );

      const ultimoDia =
        new Date(
          Date.UTC(
            ano,
            mesNumero,
            0,
            12
          )
        ).getUTCDate();

      const fimDia =
        String(
          ultimoDia
        ).padStart(
          2,
          "0"
        );

      const inicio =
        `${ano}-${mesString}-01`;

      const fim =
        `${ano}-${mesString}-${fimDia}`;

      const label =
        new Intl.DateTimeFormat(
          "pt-BR",
          {
            month: "short",
            timeZone:
              "UTC",
          }
        )
          .format(
            referencia
          )
          .replace(
            ".",
            ""
          );

      return {
        key:
          `${ano}-${mesString}`,

        mes:
          label
            .charAt(0)
            .toUpperCase() +
          label.slice(1),

        inicioISO:
          dataInicioISO(
            inicio
          ),

        fimISO:
          dataFimISO(
            fim
          ),
      };
    }
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function AdminDashboardPage() {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  /* =======================================================
     ESTADOS DASHBOARD
  ======================================================= */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    cursos,
    setCursos,
  ] =
    useState<
      Curso[]
    >([]);

  const [
    metricas,
    setMetricas,
  ] =
    useState<Metricas>({
      inscricoes: 0,
      visitas: 0,
      previas: 0,
    });

  const [
    cursosMaisVisitados,
    setCursosMaisVisitados,
  ] =
    useState<
      CursoVisitado[]
    >([]);

  const [
    ultimasInscricoes,
    setUltimasInscricoes,
  ] =
    useState<
      UltimaInscricao[]
    >([]);

  const [
    chartData,
    setChartData,
  ] =
    useState<
      GraficoInscricao[]
    >([]);

  /* =======================================================
     GOOGLE ANALYTICS
  ======================================================= */

  const [
    analytics,
    setAnalytics,
  ] =
    useState<AnalyticsDashboard>(
      ANALYTICS_VAZIO
    );

  const [
    carregandoAnalytics,
    setCarregandoAnalytics,
  ] =
    useState(true);

  const [
    erroAnalytics,
    setErroAnalytics,
  ] =
    useState("");

  /* =======================================================
     CARREGAR GOOGLE ANALYTICS
  ======================================================= */

  const carregarAnalytics =
    useCallback(
      async () => {
        setCarregandoAnalytics(
          true
        );

        setErroAnalytics("");

        try {
          const response =
            await fetch(
              "/api/admin/analytics",
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok ||
            data?.error
          ) {
            throw new Error(
              data?.error ||
                "Não foi possível carregar o Google Analytics."
            );
          }

          setAnalytics(
            data
          );
        } catch (
          error
        ) {
          console.error(
            "Erro Google Analytics:",
            error
          );

          setErroAnalytics(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados do GA4."
          );
        } finally {
          setCarregandoAnalytics(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     CARREGAR DASHBOARD
  ======================================================= */

  const carregarDashboard =
    useCallback(
      async () => {
        setLoading(
          true
        );

        setErro("");

        try {
          const mesesGrafico =
            gerarUltimosSeisMeses();

          const [
            cursosResponse,
            categoriasResponse,
            relatorioResponse,
            ultimasInscricoesResponse,
            graficoResponses,
          ] =
            await Promise.all([
              /* CURSOS */

              supabase
                .from(
                  "treinamentos_cursos"
                )
                .select(`
                  id,
                  titulo,
                  slug,
                  categoria_id,
                  status,
                  destaque,
                  created_at
                `)
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                ),

              /* CATEGORIAS */

              supabase
                .from(
                  "treinamentos_categorias"
                )
                .select(`
                  id,
                  nome
                `),

              /* RELATÓRIOS */

              supabase.rpc(
                "treinamentos_relatorios_admin"
              ),

              /* ÚLTIMAS INSCRIÇÕES */

              supabase
                .from(
                  "treinamentos_analytics"
                )
                .select(`
                  curso_slug,
                  curso_titulo,
                  created_at
                `)
                .eq(
                  "evento",
                  "inscricao_click"
                )
                .order(
                  "created_at",
                  {
                    ascending:
                      false,
                  }
                )
                .limit(5),

              /* GRÁFICO */

              Promise.all(
                mesesGrafico.map(
                  (mes) =>
                    supabase.rpc(
                      "treinamentos_relatorios_admin_periodo",
                      {
                        p_data_inicio:
                          mes.inicioISO,

                        p_data_fim:
                          mes.fimISO,
                      }
                    )
                )
              ),
            ]);

          /* =============================================
             ERROS
          ============================================= */

          const primeiroErro =
            [
              cursosResponse.error,
              relatorioResponse.error,
              ultimasInscricoesResponse.error,
            ].find(
              Boolean
            );

          if (
            primeiroErro
          ) {
            throw new Error(
              primeiroErro.message
            );
          }

          if (
            categoriasResponse.error
          ) {
            console.error(
              "Erro ao carregar categorias:",
              categoriasResponse.error
            );
          }

          const erroGrafico =
            graficoResponses.find(
              (response) =>
                Boolean(
                  response.error
                )
            )?.error;

          if (
            erroGrafico
          ) {
            console.error(
              "Erro ao carregar gráfico:",
              erroGrafico
            );
          }

          /* =============================================
             CURSOS
          ============================================= */

          const listaCursos =
            (
              cursosResponse.data ??
              []
            ) as Curso[];

          const listaCategorias =
            (
              categoriasResponse.data ??
              []
            ) as Categoria[];

          setCursos(
            listaCursos
          );

          /* =============================================
             RELATÓRIOS
          ============================================= */

          const relatorioAnalytics =
            (
              relatorioResponse.data ??
              []
            ) as RelatorioDashboardRPC[];

          /* =============================================
             TOTAIS
          ============================================= */

          const totaisAnalytics =
            relatorioAnalytics.reduce(
              (
                total,
                item
              ) => {
                total.visitas +=
                  Number(
                    item.cliques_curso ??
                      0
                  );

                total.inscricoes +=
                  Number(
                    item.cliques_inscricao ??
                      0
                  );

                total.previas +=
                  Number(
                    item.cliques_previa ??
                      0
                  );

                return total;
              },
              {
                visitas: 0,
                inscricoes: 0,
                previas: 0,
              }
            );

          setMetricas({
            inscricoes:
              totaisAnalytics.inscricoes,

            visitas:
              totaisAnalytics.visitas,

            previas:
              totaisAnalytics.previas,
          });

          /* =============================================
             CATEGORIAS
          ============================================= */

          const categoriaMap =
            new Map<
              number,
              string
            >();

          listaCategorias.forEach(
            (
              categoria
            ) => {
              categoriaMap.set(
                categoria.id,
                categoria.nome
              );
            }
          );

          /* =============================================
             MAP CURSOS
          ============================================= */

          const cursoMap =
            new Map<
              string,
              Curso
            >();

          listaCursos.forEach(
            (
              curso
            ) => {
              cursoMap.set(
                curso.slug,
                curso
              );
            }
          );

          /* =============================================
             CURSOS MAIS VISITADOS
          ============================================= */

          const ranking =
            relatorioAnalytics
              .filter(
                (
                  item
                ) =>
                  Boolean(
                    item.curso_slug
                  )
              )
              .map(
                (
                  item
                ) => {
                  const slug =
                    item.curso_slug as string;

                  const curso =
                    cursoMap.get(
                      slug
                    );

                  return {
                    slug,

                    titulo:
                      curso?.titulo ||
                      item.curso_titulo ||
                      slug,

                    visitas:
                      Number(
                        item.cliques_curso ??
                          0
                      ),

                    status:
                      curso?.status ||
                      "publicado",

                    categoria:
                      curso?.categoria_id
                        ? categoriaMap.get(
                            curso.categoria_id
                          ) ||
                          "Treinamento"
                        : "Treinamento",
                  };
                }
              )
              .filter(
                (
                  curso
                ) =>
                  curso.visitas >
                  0
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  b.visitas -
                  a.visitas
              )
              .slice(
                0,
                5
              );

          setCursosMaisVisitados(
            ranking
          );

          /* =============================================
             ÚLTIMAS INSCRIÇÕES
          ============================================= */

          const listaUltimas =
            (
              ultimasInscricoesResponse.data ??
              []
            )
              .filter(
                (
                  item
                ) =>
                  Boolean(
                    item.curso_slug
                  )
              )
              .map(
                (
                  item
                ) => ({
                  titulo:
                    item.curso_titulo ||
                    item.curso_slug ||
                    "Treinamento",

                  slug:
                    item.curso_slug as string,

                  created_at:
                    item.created_at,
                })
              );

          setUltimasInscricoes(
            listaUltimas
          );

          /* =============================================
             GRÁFICO
          ============================================= */

          const grafico =
            mesesGrafico.map(
              (
                mes,
                index
              ) => {
                const response =
                  graficoResponses[
                    index
                  ];

                if (
                  response.error
                ) {
                  return {
                    key:
                      mes.key,

                    mes:
                      mes.mes,

                    inscricoes:
                      0,
                  };
                }

                const dadosMes =
                  (
                    response.data ??
                    []
                  ) as RelatorioDashboardRPC[];

                const inscricoes =
                  dadosMes.reduce(
                    (
                      total,
                      item
                    ) =>
                      total +
                      Number(
                        item.cliques_inscricao ??
                          0
                      ),
                    0
                  );

                return {
                  key:
                    mes.key,

                  mes:
                    mes.mes,

                  inscricoes,
                };
              }
            );

          setChartData(
            grafico
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar dashboard:",
            error
          );

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o dashboard."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [supabase]
    );

  /* =======================================================
     PRIMEIRO CARREGAMENTO
  ======================================================= */

  useEffect(() => {
    void Promise.all([
      carregarDashboard(),
      carregarAnalytics(),
    ]);
  }, [
    carregarDashboard,
    carregarAnalytics,
  ]);

  /* =======================================================
     ATUALIZAR TUDO
  ======================================================= */

  function atualizarTudo() {
    void Promise.all([
      carregarDashboard(),
      carregarAnalytics(),
    ]);
  }

  /* =======================================================
     CURSOS
  ======================================================= */

  const cursosPublicados =
    useMemo(
      () =>
        cursos.filter(
          (
            curso
          ) =>
            curso.status ===
            "publicado"
        ).length,
      [
        cursos,
      ]
    );

  const cursosRascunho =
    useMemo(
      () =>
        cursos.filter(
          (
            curso
          ) =>
            curso.status ===
            "rascunho"
        ).length,
      [
        cursos,
      ]
    );

  const cursosDestaque =
    useMemo(
      () =>
        cursos.filter(
          (
            curso
          ) =>
            curso.destaque
        ).length,
      [
        cursos,
      ]
    );

  const cursoMaisRecente =
    cursos[0] ??
    null;

  /* =======================================================
     TOTAL DO GRÁFICO
  ======================================================= */

  const inscricoesUltimosMeses =
    useMemo(
      () =>
        chartData.reduce(
          (
            total,
            item
          ) =>
            total +
            item.inscricoes,
          0
        ),
      [
        chartData,
      ]
    );

  /* =======================================================
     CURSOS VISTOS GA4
  ======================================================= */

  const cursosVistosGA =
    useMemo(() => {
      return analytics.desempenhoPorOrigem.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.cursosVistos ??
              0
          ),
        0
      );
    }, [
      analytics.desempenhoPorOrigem,
    ]);

  /* =======================================================
     REDES SOCIAIS
  ======================================================= */

  const redesSociais =
    useMemo(() => {
      const redes = [
        {
          nome:
            "Instagram",

          icon:
            FaInstagram,
        },

        {
          nome:
            "Facebook",

          icon:
            FaFacebookF,
        },

        {
          nome:
            "LinkedIn",

          icon:
            FaLinkedinIn,
        },

        {
          nome:
            "WhatsApp",

          icon:
            FaWhatsapp,
        },

        {
          nome:
            "TikTok",

          icon:
            FaTiktok,
        },

        {
          nome:
            "YouTube",

          icon:
            FaYoutube,
        },
      ];

      return redes.map(
        (
          rede
        ) => {
          const dadosRede =
            analytics.origens.find(
              (
                item
              ) =>
                item.origem.toLowerCase() ===
                rede.nome.toLowerCase()
            );

          return {
            ...rede,

            visitantes:
              dadosRede?.visitantes ??
              0,

            sessoes:
              dadosRede?.sessoes ??
              0,

            percentual:
              dadosRede?.percentual ??
              0,
          };
        }
      );
    }, [
      analytics.origens,
    ]);

/* =======================================================
   CANAIS DE AQUISIÇÃO
======================================================= */

const canaisAquisicao =
  useMemo(() => {
    const totalSessoes =
      analytics.canais.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.sessoes ??
              0
          ),
        0
      );

    return [
      ...analytics.canais,
    ]
      .sort(
        (
          a,
          b
        ) =>
          Number(
            b.sessoes
          ) -
          Number(
            a.sessoes
          )
      )
      .map(
        (
          item
        ) => {
          const sessoes =
            Number(
              item.sessoes ??
                0
            );

          const percentual =
            totalSessoes >
            0
              ? Math.round(
                  (sessoes /
                    totalSessoes) *
                    100
                )
              : 0;

          return {
            ...item,

            sessoes,

            percentual,

            nome:
              traduzirCanalGA4(
                item.canal
              ),

            detalhe:
              formatarOrigemMidiaGA4(
                item
              ),
          };
        }
      );
  }, [
    analytics.canais,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

        <div>

          <p className="text-sm font-medium text-emerald-600">
            Visão geral
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
            Dashboard
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Acompanhe o desempenho dos treinamentos e as últimas movimentações.
          </p>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={
              atualizarTudo
            }
            disabled={
              loading ||
              carregandoAnalytics
            }
            className="
              inline-flex h-9 items-center justify-center gap-2
              rounded-md border border-zinc-200 bg-white px-4
              text-sm font-medium text-zinc-600
              shadow-sm transition
              hover:bg-zinc-50
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >

            <RefreshCw
              size={16}
              className={
                loading ||
                carregandoAnalytics
                  ? "animate-spin"
                  : ""
              }
            />

            Atualizar

          </button>

          <Link
            href="/admin/treinamentos/novo"
            className="
              inline-flex h-9 items-center justify-center gap-2
              rounded-md bg-emerald-600 px-4
              text-sm font-medium text-white
              transition-colors
              hover:bg-emerald-700
            "
          >

            <BookOpen
              size={17}
            />

            Novo curso

          </Link>

        </div>

      </div>

      {/* =================================================
          ERRO
      ================================================= */}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          Não foi possível carregar alguns dados do Dashboard:{" "}

          {erro}

        </div>
      )}

      {/* =================================================
          CARDS
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <MetricCard
          title="Cursos publicados"
          value={
            loading
              ? "..."
              : String(
                  cursosPublicados
                )
          }
          description={
            loading
              ? "Carregando..."
              : `${cursos.length} cadastrados`
          }
          icon={
            <BookOpen
              size={20}
            />
          }
        />

        <MetricCard
          title="Inscrições"
          value={
            loading
              ? "..."
              : String(
                  metricas.inscricoes
                )
          }
          description="cliques nos links de inscrição"
          icon={
            <GraduationCap
              size={20}
            />
          }
        />

        <MetricCard
          title="Visitas nos cursos"
          value={
            loading
              ? "..."
              : String(
                  metricas.visitas
                )
          }
          description="acessos registrados aos cursos"
          icon={
            <Eye
              size={20}
            />
          }
        />

        <MetricCard
          title="Prévias acessadas"
          value={
            loading
              ? "..."
              : String(
                  metricas.previas
                )
          }
          description="cliques para visualizar a prévia"
          icon={
            <MousePointerClick
              size={20}
            />
          }
        />

      </div>

      {/* =================================================
          GRÁFICO + RESUMO
      ================================================= */}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

        <Card className="border-zinc-200 shadow-sm">

          <CardHeader className="flex flex-row items-start justify-between">

            <div>

              <CardTitle className="text-base">
                Inscrições nos treinamentos
              </CardTitle>

              <CardDescription>
                Cliques nos links de inscrição nos últimos 6 meses.
              </CardDescription>

            </div>

            <Badge
              variant="secondary"
              className="bg-emerald-50 text-emerald-700"
            >
              {loading
                ? "..."
                : `${inscricoesUltimosMeses} cliques`}
            </Badge>

          </CardHeader>

          <CardContent>

            <div className="h-[320px] w-full">

              {loading ? (
                <div className="flex h-full items-center justify-center">

                  <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />

                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={
                      chartData
                    }
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >

                    <defs>

                      <linearGradient
                        id="inscricoesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >

                        <stop
                          offset="5%"
                          stopColor="#059669"
                          stopOpacity={
                            0.25
                          }
                        />

                        <stop
                          offset="95%"
                          stopColor="#059669"
                          stopOpacity={
                            0
                          }
                        />

                      </linearGradient>

                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={
                        false
                      }
                      stroke="#e4e4e7"
                    />

                    <XAxis
                      dataKey="mes"
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={
                        12
                      }
                    />

                    <YAxis
                      tickLine={
                        false
                      }
                      axisLine={
                        false
                      }
                      fontSize={
                        12
                      }
                      allowDecimals={
                        false
                      }
                    />

                    <Tooltip
                      cursor={{
                        stroke:
                          "#059669",

                        strokeDasharray:
                          "4 4",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="inscricoes"
                      name="Inscrições"
                      stroke="#059669"
                      strokeWidth={
                        2.5
                      }
                      fill="url(#inscricoesGradient)"
                    />

                  </AreaChart>

                </ResponsiveContainer>
              )}

            </div>

          </CardContent>

        </Card>

        {/* =================================================
            RESUMO
        ================================================= */}

        <Card className="border-zinc-200 shadow-sm">

          <CardHeader>

            <CardTitle className="text-base">
              Resumo rápido
            </CardTitle>

            <CardDescription>
              Indicadores dos treinamentos.
            </CardDescription>

          </CardHeader>

          <CardContent className="space-y-5">

            <SummaryItem
              label="Cursos publicados"
              value={
                loading
                  ? "..."
                  : String(
                      cursosPublicados
                    )
              }
              detail={`de ${cursos.length} cadastrados`}
            />

            <SummaryItem
              label="Cursos em rascunho"
              value={
                loading
                  ? "..."
                  : String(
                      cursosRascunho
                    )
              }
              detail="aguardando publicação"
            />

            <SummaryItem
              label="Cursos em destaque"
              value={
                loading
                  ? "..."
                  : String(
                      cursosDestaque
                    )
              }
              detail="destacados no site"
            />

            <SummaryItem
              label="Curso mais recente"
              value={
                loading
                  ? "..."
                  : cursoMaisRecente
                    ? formatarDataCurta(
                        cursoMaisRecente.created_at
                      )
                    : "-"
              }
              detail={
                cursoMaisRecente
                  ? cursoMaisRecente.titulo
                  : "Nenhum curso cadastrado"
              }
            />

          </CardContent>

        </Card>

      </div>

      {/* =================================================
          CURSOS + ÚLTIMAS INSCRIÇÕES
      ================================================= */}

      <div className="grid gap-6 xl:grid-cols-2">

        {/* =================================================
            CURSOS MAIS VISITADOS
        ================================================= */}

        <Card className="border-zinc-200 shadow-sm">

          <CardHeader className="flex flex-row items-center justify-between">

            <div>

              <CardTitle className="text-base">
                Cursos mais visitados
              </CardTitle>

              <CardDescription>
                Treinamentos com maior número de acessos registrados.
              </CardDescription>

            </div>

            <Link
              href="/admin/relatorios"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Ver relatório

              <ArrowUpRight
                size={14}
              />
            </Link>

          </CardHeader>

          <CardContent>

            {loading ? (
              <LoadingBlock />
            ) : cursosMaisVisitados.length ===
              0 ? (
              <EmptyBlock
                texto="Ainda não existem visitas registradas."
              />
            ) : (
              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>
                      Curso
                    </TableHead>

                    <TableHead>
                      Categoria
                    </TableHead>

                    <TableHead className="text-right">
                      Visitas
                    </TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {cursosMaisVisitados.map(
                    (
                      curso
                    ) => (
                      <TableRow
                        key={
                          curso.slug
                        }
                      >

                        <TableCell>

                          <Link
                            href={`/cursos/${curso.slug}`}
                            target="_blank"
                            className="font-medium text-zinc-900 transition hover:text-emerald-600"
                          >
                            {
                              curso.titulo
                            }
                          </Link>

                          <div className="mt-1 flex items-center gap-2">

                            <span className="text-xs text-zinc-400">
                              /cursos/
                              {
                                curso.slug
                              }
                            </span>

                            <StatusBadge
                              status={
                                curso.status
                              }
                            />

                          </div>

                        </TableCell>

                        <TableCell className="text-sm text-zinc-500">
                          {
                            curso.categoria
                          }
                        </TableCell>

                        <TableCell className="text-right">

                          <strong className="text-zinc-900">
                            {
                              curso.visitas
                            }
                          </strong>

                        </TableCell>

                      </TableRow>
                    )
                  )}

                </TableBody>

              </Table>
            )}

          </CardContent>

        </Card>

        {/* =================================================
            ÚLTIMAS INSCRIÇÕES
        ================================================= */}

        <Card className="border-zinc-200 shadow-sm">

          <CardHeader className="flex flex-row items-center justify-between">

            <div>

              <CardTitle className="text-base">
                Últimas inscrições
              </CardTitle>

              <CardDescription>
                Últimos cliques registrados nos links de inscrição.
              </CardDescription>

            </div>

            <Link
              href="/admin/inscricoes"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Ver inscrições

              <ArrowUpRight
                size={14}
              />
            </Link>

          </CardHeader>

          <CardContent>

            {loading ? (
              <LoadingBlock />
            ) : ultimasInscricoes.length ===
              0 ? (
              <EmptyBlock
                texto="Ainda não existem inscrições registradas."
              />
            ) : (
              <div className="divide-y divide-zinc-100">

                {ultimasInscricoes.map(
                  (
                    inscricao,
                    index
                  ) => (
                    <div
                      key={`${inscricao.slug}-${inscricao.created_at}-${index}`}
                      className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                    >

                      <div className="min-w-0">

                        <Link
                          href={`/cursos/${inscricao.slug}`}
                          target="_blank"
                          className="block truncate text-sm font-semibold text-zinc-900 transition hover:text-emerald-600"
                        >
                          {
                            inscricao.titulo
                          }
                        </Link>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">

                          <Clock
                            size={13}
                          />

                          {formatarDataHora(
                            inscricao.created_at
                          )}

                        </div>

                      </div>

                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-emerald-50 text-emerald-700"
                      >
                        Inscrição
                      </Badge>

                    </div>
                  )
                )}

              </div>
            )}

          </CardContent>

        </Card>

      </div>

      {/* =================================================
          CURSOS RECENTES
      ================================================= */}

      <Card className="border-zinc-200 shadow-sm">

        <CardHeader className="flex flex-row items-center justify-between">

          <div>

            <CardTitle className="text-base">
              Cursos cadastrados recentemente
            </CardTitle>

            <CardDescription>
              Últimos treinamentos adicionados à plataforma.
            </CardDescription>

          </div>

          <Link
            href="/admin/treinamentos"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            Ver todos

            <ArrowUpRight
              size={14}
            />
          </Link>

        </CardHeader>

        <CardContent>

          {loading ? (
            <LoadingBlock />
          ) : cursos.length ===
            0 ? (
            <EmptyBlock
              texto="Nenhum curso cadastrado."
            />
          ) : (
            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead>
                    Treinamento
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead>
                    Destaque
                  </TableHead>

                  <TableHead>
                    Criado em
                  </TableHead>

                  <TableHead className="text-right">
                    Ação
                  </TableHead>

                </TableRow>

              </TableHeader>

              <TableBody>

                {cursos
                  .slice(
                    0,
                    5
                  )
                  .map(
                    (
                      curso
                    ) => (
                      <TableRow
                        key={
                          curso.id
                        }
                      >

                        <TableCell>

                          <div className="font-medium text-zinc-900">
                            {
                              curso.titulo
                            }
                          </div>

                          <div className="mt-1 text-xs text-zinc-400">
                            /cursos/
                            {
                              curso.slug
                            }
                          </div>

                        </TableCell>

                        <TableCell>

                          <StatusBadge
                            status={
                              curso.status
                            }
                          />

                        </TableCell>

                        <TableCell>

                          {curso.destaque ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                              Sim
                            </Badge>
                          ) : (
                            <span className="text-sm text-zinc-400">
                              Não
                            </span>
                          )}

                        </TableCell>

                        <TableCell className="text-sm text-zinc-500">
                          {formatarData(
                            curso.created_at
                          )}
                        </TableCell>

                        <TableCell className="text-right">

                          <Link
                            href={`/admin/treinamentos/${curso.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                          >
                            Editar

                            <ArrowUpRight
                              size={13}
                            />
                          </Link>

                        </TableCell>

                      </TableRow>
                    )
                  )}

              </TableBody>

            </Table>
          )}

        </CardContent>

      </Card>

      {/* =================================================
          AQUISIÇÃO DE VISITANTES
      ================================================= */}

      <section className="space-y-6 border-t border-zinc-200 pt-8">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#667cf8]">

              <Globe2
                size={16}
              />

              Google Analytics

            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
              Aquisição de visitantes
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Entenda como as pessoas encontram o site antes de interagir com os treinamentos.
            </p>

          </div>

          <Link
            href="/admin/relatorios"
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            Ver relatório completo

            <ArrowUpRight
              size={15}
            />
          </Link>

        </div>

        {/* ERRO */}

        {erroAnalytics && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">

            Não foi possível carregar o Google Analytics:{" "}

            {erroAnalytics}

          </div>
        )}

        {/* =================================================
            MÉTRICAS GA4
        ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <AnalyticsMetricCard
            titulo="Visitantes"
            valor={
              analytics.resumo.visitantes
            }
            descricao="Usuários ativos no período"
            carregando={
              carregandoAnalytics
            }
            icon={
              Users
            }
          />

          <AnalyticsMetricCard
            titulo="Sessões"
            valor={
              analytics.resumo.sessoes
            }
            descricao="Visitas iniciadas no site"
            carregando={
              carregandoAnalytics
            }
            icon={
              Activity
            }
          />

          <AnalyticsMetricCard
            titulo="Visualizações"
            valor={
              analytics.resumo.visualizacoes
            }
            descricao="Visualizações de páginas do site"
            carregando={
              carregandoAnalytics
            }
            icon={
              Eye
            }
          />

          <AnalyticsMetricCard
            titulo="Cursos vistos"
            valor={
              cursosVistosGA
            }
            descricao="Visualizações em páginas /cursos/*"
            carregando={
              carregandoAnalytics
            }
            icon={
              GraduationCap
            }
          />

        </div>

        {/* =================================================
            REDES SOCIAIS
        ================================================= */}

        <div>

          <div className="mb-4">

            <h3 className="text-lg font-bold text-zinc-900">
              Redes sociais
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Visitantes e sessões originados das principais redes sociais.
            </p>

          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {redesSociais.map(
              (
                rede
              ) => {
                const Icon =
                  rede.icon;

                return (
                  <article
                    key={
                      rede.nome
                    }
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >

                    <div className="mb-4 flex items-center justify-between">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">

                        <Icon
                          size={18}
                        />

                      </div>

                      {rede.percentual >
                        0 && (
                        <span className="rounded-full bg-[#667cf8]/10 px-2 py-1 text-[11px] font-bold text-[#667cf8]">

                          {
                            rede.percentual
                          }
                          %

                        </span>
                      )}

                    </div>

                    <strong className="block text-sm font-bold text-zinc-900">
                      {
                        rede.nome
                      }
                    </strong>

                    <div className="mt-4 flex items-end justify-between gap-3">

                      <div>

                        <strong className="block text-2xl font-bold text-zinc-950">
                          {carregandoAnalytics
                            ? "..."
                            : formatarNumero(
                                rede.visitantes
                              )}
                        </strong>

                        <span className="mt-1 block text-xs text-zinc-400">
                          visitantes
                        </span>

                      </div>

                      <div className="text-right">

                        <strong className="block text-sm font-bold text-zinc-700">
                          {carregandoAnalytics
                            ? "..."
                            : formatarNumero(
                                rede.sessoes
                              )}
                        </strong>

                        <span className="mt-1 block text-xs text-zinc-400">
                          sessões
                        </span>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        </div>

        {/* =================================================
            ORIGENS + CANAIS
        ================================================= */}

        <div className="grid gap-6 xl:grid-cols-2">

    {/* ===============================================
    DE ONDE VIERAM
=============================================== */}

<AnalyticsCard
  titulo="De onde vieram"
  descricao="Participação das origens nas sessões do site."
  icon={Globe2}
>
  {analytics.origens.length === 0 ? (
    <AnalyticsEmpty />
  ) : (
    <div className="space-y-5">

      {analytics.origens
        .slice(0, 10)
        .map((item) => {
          const origemFormatada =
            formatarOrigemResumoGA4(
              item.origem
            );

          return (
            <div
              key={item.origem}
            >

              <div className="mb-2 flex items-start justify-between gap-4">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <strong className="text-sm text-zinc-800">
                      {
                        origemFormatada.nome
                      }
                    </strong>

                    <span className="text-xs text-zinc-400">
                      {formatarNumero(
                        item.sessoes
                      )}{" "}
                      sessões
                    </span>

                  </div>

                  {origemFormatada.descricao && (
                    <span className="mt-1 block text-[11px] leading-4 text-zinc-400">
                      {
                        origemFormatada.descricao
                      }
                    </span>
                  )}

                </div>

                <strong className="shrink-0 text-sm text-[#667cf8]">
                  {
                    item.percentual
                  }
                  %
                </strong>

              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-100">

                <div
                  className="h-full rounded-full bg-[#667cf8] transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        item.percentual,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />

              </div>

            </div>
          );
        })}

    </div>
  )}
</AnalyticsCard>
        {/* =================================================
    CANAIS DE AQUISIÇÃO
================================================= */}

<Card className="border-zinc-200 shadow-sm">

  <CardHeader>

    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">

        <Network
          size={19}
        />

      </div>

      <div className="min-w-0">

        <CardTitle className="text-base">
          Canais de aquisição
        </CardTitle>

        <CardDescription>
          Como os visitantes chegaram ao site.
        </CardDescription>

      </div>

    </div>

  </CardHeader>

  <CardContent>

    {carregandoAnalytics ? (
      <AnalyticsLoading />
    ) : canaisAquisicao.length ===
      0 ? (
      <AnalyticsVazio />
    ) : (
      <div className="space-y-3">

        {/* RESUMO */}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3">

          <div>

            <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Sessões analisadas
            </span>

            <strong className="mt-0.5 block text-lg font-bold text-zinc-900">
              {formatarNumero(
                canaisAquisicao.reduce(
                  (
                    total,
                    item
                  ) =>
                    total +
                    item.sessoes,
                  0
                )
              )}
            </strong>

          </div>

          <div className="text-right">

            <span className="block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              Canais encontrados
            </span>

            <strong className="mt-0.5 block text-lg font-bold text-[#667cf8]">
              {
                canaisAquisicao.length
              }
            </strong>

          </div>

        </div>

        {/* CANAIS */}

        {canaisAquisicao
          .slice(
            0,
            7
          )
          .map(
            (
              item,
              index
            ) => {
              const naoIdentificado =
                item.canal ===
                "Unassigned";

              return (
                <div
                  key={`${item.canal}-${item.origemMidia}-${index}`}
                  className="
                    rounded-xl
                    border border-zinc-100
                    bg-white
                    p-4
                    transition
                    hover:border-zinc-200
                    hover:bg-zinc-50/50
                  "
                >

                  {/* TOPO */}

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <strong className="text-sm font-bold text-zinc-900">
                          {
                            item.nome
                          }
                        </strong>

                        {naoIdentificado && (
                          <span className="
                            rounded-full
                            bg-amber-100
                            px-2
                            py-0.5
                            text-[9px]
                            font-bold
                            uppercase
                            tracking-wide
                            text-amber-700
                          ">
                            Revisar origem
                          </span>
                        )}

                      </div>

                      <span className="mt-1 block truncate text-xs text-zinc-400">
                        {
                          item.detalhe
                        }
                      </span>

                    </div>

                    <div className="shrink-0 text-right">

                      <strong className="block text-base font-bold text-zinc-950">
                        {formatarNumero(
                          item.sessoes
                        )}
                      </strong>

                      <span className="block text-[11px] text-zinc-400">
                        sessões
                      </span>

                    </div>

                  </div>

                  {/* BARRA */}

                  <div className="mt-3">

                    <div className="mb-1.5 flex items-center justify-between">


                      <strong className="text-xs font-bold text-[#667cf8]">
                        {
                          item.percentual
                        }
                        %
                      </strong>

                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">

                      <div
                        className="h-full rounded-full bg-[#667cf8] transition-all"
                        style={{
                          width: `${Math.min(
                            Math.max(
                              item.percentual,
                              0
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* EXPLICAÇÃO UNASSIGNED */}

                  {naoIdentificado && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-700">
                      O Google Analytics recebeu esta visita, mas não conseguiu identificar corretamente o canal de origem. Isso pode acontecer quando links não possuem parâmetros UTM ou quando os dados de referência não estão disponíveis.
                    </p>
                  )}

                </div>
              );
            }
          )}

      </div>
    )}

  </CardContent>

</Card>

        </div>

      </section>

    </div>
  );
}

/* =========================================================
   CARD MÉTRICA
========================================================= */

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">

      <CardContent className="p-5">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-sm font-medium text-zinc-500">
              {title}
            </p>

            <strong className="mt-3 block text-3xl font-bold tracking-tight text-zinc-950">
              {value}
            </strong>

            <p className="mt-2 text-xs leading-5 text-zinc-400">
              {description}
            </p>

          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            {icon}
          </div>

        </div>

      </CardContent>

    </Card>
  );
}

/* =========================================================
   RESUMO
========================================================= */

function SummaryItem({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">

      <div>

        <p className="text-sm font-medium text-zinc-700">
          {label}
        </p>

        <p className="mt-1 max-w-[220px] text-xs leading-5 text-zinc-400">
          {detail}
        </p>

      </div>

      <strong className="shrink-0 text-lg font-bold text-zinc-950">
        {value}
      </strong>

    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (
    status ===
    "publicado"
  ) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Publicado
      </Badge>
    );
  }

  if (
    status ===
    "rascunho"
  ) {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-50 text-amber-700"
      >
        Rascunho
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="capitalize"
    >
      {status}
    </Badge>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingBlock() {
  return (
    <div className="flex min-h-[180px] items-center justify-center">

      <div className="flex items-center gap-2 text-sm text-zinc-400">

        <LoaderCircle className="h-5 w-5 animate-spin text-emerald-600" />

        Carregando...

      </div>

    </div>
  );
}

/* =========================================================
   VAZIO
========================================================= */

function EmptyBlock({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-xl bg-zinc-50 px-6 text-center">

      <p className="text-sm text-zinc-500">
        {texto}
      </p>

    </div>
  );
}

/* =========================================================
   ANALYTICS METRIC CARD
========================================================= */

function AnalyticsMetricCard({
  titulo,
  valor,
  descricao,
  carregando,
  icon: Icon,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  carregando: boolean;
  icon: ElementType;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">

      <CardContent className="p-5">

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-sm font-medium text-zinc-500">
              {
                titulo
              }
            </p>

            <strong className="mt-3 block text-3xl font-bold tracking-tight text-zinc-950">
              {carregando
                ? "..."
                : formatarNumero(
                    valor
                  )}
            </strong>

            <span className="mt-2 block text-xs text-zinc-400">
              {
                descricao
              }
            </span>

          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">

            <Icon
              size={20}
            />

          </div>

        </div>

      </CardContent>

    </Card>
  );
}

/* =========================================================
   CARD ANALYTICS
========================================================= */

function AnalyticsCard({
  titulo,
  descricao,
  icon: Icon,
  children,
}: {
  titulo: string;
  descricao: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">
            <Icon size={19} />
          </div>

          <div className="min-w-0">
            <CardTitle className="text-base">
              {titulo}
            </CardTitle>

            <CardDescription>
              {descricao}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}

/* =========================================================
   ANALYTICS SEM DADOS
========================================================= */

function AnalyticsEmpty() {
  return <AnalyticsVazio />;
}

/* =========================================================
   ANALYTICS LOADING
========================================================= */

function AnalyticsLoading() {
  return (
    <div className="flex min-h-[110px] items-center justify-center">

      <LoaderCircle className="h-5 w-5 animate-spin text-[#667cf8]" />

    </div>
  );
}

/* =========================================================
   ANALYTICS VAZIO
========================================================= */

function AnalyticsVazio() {
  return (
    <div className="flex min-h-[110px] items-center justify-center rounded-xl bg-zinc-50 px-5 text-center">

      <p className="text-sm text-zinc-400">
        Ainda não há dados processados.
      </p>

    </div>
  );
}