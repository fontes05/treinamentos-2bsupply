"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Eye,
  Globe2,
  GraduationCap,
  MousePointerClick,
  Network,
  RefreshCw,
  Route,
  TrendingUp,
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

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TIPOS - SUPABASE
========================================================= */

type RelatorioRPC = {
  curso_slug: string;
  curso_titulo: string;
  cliques_curso: number | string | null;
  cliques_inscricao: number | string | null;
  cliques_previa: number | string | null;
};

type Relatorio = {
  curso_slug: string;
  curso_titulo: string;
  cliques_curso: number;
  cliques_inscricao: number;
  cliques_previa: number;
};

type PeriodoAplicado = {
  inicio: string;
  fim: string;
  label: string;
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

type AnalyticsPaginaEntrada = {
  pagina: string;
  sessoes: number;
};

type AnalyticsDesempenhoOrigem = {
  origem: string;
  visitantes: number;
  cursosVistos: number;

  /*
   * Estes dois campos ficarão disponíveis
   * quando adicionarmos inscricao_click ao GA4.
   */
  inscricoes?: number;
  conversao?: number;
};

type AnalyticsData = {
  periodo: {
    inicio: string;
    fim: string;
  };

  resumo: {
    visitantes: number;
    sessoes: number;
    visualizacoes: number;
  };

  origens: AnalyticsOrigem[];
  canais: AnalyticsCanal[];
  paginasEntrada: AnalyticsPaginaEntrada[];
  desempenhoPorOrigem: AnalyticsDesempenhoOrigem[];
};

type AnalyticsError = {
  error: string;
};

/* =========================================================
   ANALYTICS VAZIO
========================================================= */

const ANALYTICS_VAZIO: AnalyticsData = {
  periodo: {
    inicio: "",
    fim: "",
  },

  resumo: {
    visitantes: 0,
    sessoes: 0,
    visualizacoes: 0,
  },

  origens: [],
  canais: [],
  paginasEntrada: [],
  desempenhoPorOrigem: [],
};

/* =========================================================
   HELPERS
========================================================= */

function normalizarRelatorio(
  dados: RelatorioRPC[]
): Relatorio[] {
  return dados.map((item) => ({
    curso_slug: item.curso_slug,
    curso_titulo: item.curso_titulo,

    cliques_curso: Number(
      item.cliques_curso ?? 0
    ),

    cliques_inscricao: Number(
      item.cliques_inscricao ?? 0
    ),

    cliques_previa: Number(
      item.cliques_previa ?? 0
    ),
  }));
}

/* ---------------------------------------------------------
   FORMATAR NÚMERO
--------------------------------------------------------- */

function formatarNumero(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR"
  ).format(valor);
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

/* ---------------------------------------------------------
   SUBTRAIR DIAS
--------------------------------------------------------- */

function subtrairDias(
  dateInput: string,
  dias: number
) {
  const date =
    new Date(
      `${dateInput}T12:00:00-03:00`
    );

  date.setDate(
    date.getDate() - dias
  );

  return getDateInputSaoPaulo(
    date
  );
}

/* ---------------------------------------------------------
   PRIMEIRO DIA DO MÊS
--------------------------------------------------------- */

function primeiroDiaMes(
  dateInput: string
) {
  const [year, month] =
    dateInput.split("-");

  return `${year}-${month}-01`;
}

/* ---------------------------------------------------------
   FORMATAÇÃO VISUAL
--------------------------------------------------------- */

function formatarDataFiltro(
  value: string
) {
  if (!value) {
    return "";
  }

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
    new Date(
      `${value}T12:00:00-03:00`
    )
  );
}

/* ---------------------------------------------------------
   ISO INÍCIO
--------------------------------------------------------- */

function dataInicioISO(
  value: string
) {
  return new Date(
    `${value}T00:00:00-03:00`
  ).toISOString();
}

/* ---------------------------------------------------------
   ISO FIM
--------------------------------------------------------- */

function dataFimISO(
  value: string
) {
  return new Date(
    `${value}T23:59:59.999-03:00`
  ).toISOString();
}

/* =========================================================
   FORMATAR PÁGINA DE ENTRADA
========================================================= */

function formatarPaginaEntrada(
  pagina: string,
  cursos: Relatorio[]
) {
  const path =
    pagina
      .split("?")[0]
      .replace(/\/+$/, "") || "/";

  if (path === "/") {
    return "Home";
  }

  if (path === "/cursos") {
    return "Todos os treinamentos";
  }

  if (
    path.startsWith(
      "/cursos/"
    )
  ) {
    const slug =
      path.replace(
        "/cursos/",
        ""
      );

    const curso =
      cursos.find(
        (item) =>
          item.curso_slug ===
          slug
      );

    if (curso) {
      return curso.curso_titulo;
    }

    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letra) =>
        letra.toUpperCase()
      );
  }

  return path;
}

/* =========================================================
   PÁGINA
========================================================= */

export default function RelatoriosPage() {
  /* =======================================================
     SUPABASE
  ======================================================= */

  const [dados, setDados] =
    useState<Relatorio[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    carregadoUmaVez,
    setCarregadoUmaVez,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  /* =======================================================
     GOOGLE ANALYTICS
  ======================================================= */

  const [
    analytics,
    setAnalytics,
  ] =
    useState<AnalyticsData>(
      ANALYTICS_VAZIO
    );

  const [
    carregandoAnalytics,
    setCarregandoAnalytics,
  ] = useState(true);

  const [
    erroAnalytics,
    setErroAnalytics,
  ] = useState("");

  /* =======================================================
     DATA ATUAL
  ======================================================= */

  const hoje =
    useMemo(
      () =>
        getDateInputSaoPaulo(
          new Date()
        ),
      []
    );

  /* =======================================================
     CAMPOS DO FILTRO
  ======================================================= */

  const [
    dataInicio,
    setDataInicio,
  ] = useState("");

  const [
    dataFim,
    setDataFim,
  ] = useState("");

  const [
    periodoAplicado,
    setPeriodoAplicado,
  ] =
    useState<PeriodoAplicado>({
      inicio: "",
      fim: "",
      label:
        "Todo o período",
    });

  /* =======================================================
     CARREGAR GOOGLE ANALYTICS
  ======================================================= */

  const carregarAnalytics =
    useCallback(
      async (
        inicio = "",
        fim = ""
      ) => {
        setCarregandoAnalytics(
          true
        );

        setErroAnalytics("");

        try {
          const params =
            new URLSearchParams();

          /*
           * Como o GA4 foi criado agora,
           * usar uma data antiga no "Todo o período"
           * não causa problema.
           *
           * Assim evitamos o padrão de 30 dias
           * da rota da API.
           */
          params.set(
            "inicio",
            inicio ||
              "2020-01-01"
          );

          params.set(
            "fim",
            fim || hoje
          );

          const response =
            await fetch(
              `/api/admin/analytics?${params.toString()}`,
              {
                cache:
                  "no-store",
              }
            );

          const payload =
            (await response.json()) as
              | AnalyticsData
              | AnalyticsError;

          if (
            !response.ok ||
            "error" in payload
          ) {
            throw new Error(
              "error" in payload
                ? payload.error
                : "Não foi possível carregar os dados do Google Analytics."
            );
          }

          setAnalytics(
            payload
          );
        } catch (error) {
          console.error(
            "Erro ao carregar Google Analytics:",
            error
          );

          setErroAnalytics(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o Google Analytics."
          );
        } finally {
          setCarregandoAnalytics(
            false
          );
        }
      },
      [hoje]
    );

  /* =======================================================
     CARREGAR RELATÓRIOS SUPABASE
  ======================================================= */

  const carregarRelatorios =
    useCallback(
      async (
        inicio = "",
        fim = "",
        label =
          "Todo o período"
      ) => {
        setCarregando(true);
        setErro("");

        try {
          const supabase =
            createClient();

          let dadosRPC:
            | RelatorioRPC[]
            | null = null;

          /* =============================================
             TODO O PERÍODO
          ============================================= */

          if (
            !inicio &&
            !fim
          ) {
            const {
              data,
              error,
            } =
              await supabase.rpc(
                "treinamentos_relatorios_admin"
              );

            if (error) {
              throw new Error(
                error.message
              );
            }

            dadosRPC =
              (data ??
                []) as RelatorioRPC[];
          }

          /* =============================================
             PERÍODO FILTRADO
          ============================================= */

          else {
            const {
              data,
              error,
            } =
              await supabase.rpc(
                "treinamentos_relatorios_admin_periodo",
                {
                  p_data_inicio:
                    inicio
                      ? dataInicioISO(
                          inicio
                        )
                      : null,

                  p_data_fim:
                    fim
                      ? dataFimISO(
                          fim
                        )
                      : null,
                }
              );

            if (error) {
              throw new Error(
                error.message
              );
            }

            dadosRPC =
              (data ??
                []) as RelatorioRPC[];
          }

          const relatorio =
            normalizarRelatorio(
              dadosRPC ?? []
            );

          relatorio.sort(
            (a, b) =>
              b.cliques_curso -
              a.cliques_curso
          );

          setDados(
            relatorio
          );

          setPeriodoAplicado({
            inicio,
            fim,
            label,
          });
        } catch (error) {
          console.error(
            "Erro ao carregar relatórios:",
            error
          );

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os relatórios."
          );
        } finally {
          setCarregando(
            false
          );

          setCarregadoUmaVez(
            true
          );
        }
      },
      []
    );

  /* =======================================================
     CARREGAR TUDO
  ======================================================= */

  const carregarTudo =
    useCallback(
      async (
        inicio = "",
        fim = "",
        label =
          "Todo o período"
      ) => {
        await Promise.all([
          carregarRelatorios(
            inicio,
            fim,
            label
          ),

          carregarAnalytics(
            inicio,
            fim
          ),
        ]);
      },
      [
        carregarAnalytics,
        carregarRelatorios,
      ]
    );

  /* =======================================================
     PRIMEIRO CARREGAMENTO
  ======================================================= */

  useEffect(() => {
    void carregarTudo(
      "",
      "",
      "Todo o período"
    );
  }, [carregarTudo]);

  /* =======================================================
     TODO O PERÍODO
  ======================================================= */

  function aplicarTodoPeriodo() {
    setDataInicio("");
    setDataFim("");

    void carregarTudo(
      "",
      "",
      "Todo o período"
    );
  }

  /* =======================================================
     HOJE
  ======================================================= */

  function aplicarHoje() {
    setDataInicio(hoje);
    setDataFim(hoje);

    void carregarTudo(
      hoje,
      hoje,
      "Hoje"
    );
  }

  /* =======================================================
     ÚLTIMOS 7 DIAS
  ======================================================= */

  function aplicarUltimos7Dias() {
    const inicio =
      subtrairDias(
        hoje,
        6
      );

    setDataInicio(
      inicio
    );

    setDataFim(hoje);

    void carregarTudo(
      inicio,
      hoje,
      "Últimos 7 dias"
    );
  }

  /* =======================================================
     ÚLTIMOS 30 DIAS
  ======================================================= */

  function aplicarUltimos30Dias() {
    const inicio =
      subtrairDias(
        hoje,
        29
      );

    setDataInicio(
      inicio
    );

    setDataFim(hoje);

    void carregarTudo(
      inicio,
      hoje,
      "Últimos 30 dias"
    );
  }

  /* =======================================================
     ESTE MÊS
  ======================================================= */

  function aplicarEsteMes() {
    const inicio =
      primeiroDiaMes(
        hoje
      );

    setDataInicio(
      inicio
    );

    setDataFim(hoje);

    void carregarTudo(
      inicio,
      hoje,
      "Este mês"
    );
  }

  /* =======================================================
     FILTRO PERSONALIZADO
  ======================================================= */

  function aplicarFiltroPersonalizado() {
    setErro("");

    if (
      dataInicio &&
      dataFim &&
      dataInicio >
        dataFim
    ) {
      setErro(
        "A data inicial não pode ser maior que a data final."
      );

      return;
    }

    let label =
      "Período personalizado";

    if (
      dataInicio &&
      dataFim
    ) {
      label =
        `${formatarDataFiltro(
          dataInicio
        )} até ${formatarDataFiltro(
          dataFim
        )}`;
    } else if (
      dataInicio
    ) {
      label =
        `A partir de ${formatarDataFiltro(
          dataInicio
        )}`;
    } else if (
      dataFim
    ) {
      label =
        `Até ${formatarDataFiltro(
          dataFim
        )}`;
    } else {
      label =
        "Todo o período";
    }

    void carregarTudo(
      dataInicio,
      dataFim,
      label
    );
  }

  /* =======================================================
     TOTAIS SUPABASE
  ======================================================= */

  const totais =
    useMemo(() => {
      return dados.reduce(
        (
          total,
          item
        ) => {
          total.cursos +=
            item.cliques_curso;

          total.inscricoes +=
            item.cliques_inscricao;

          total.previas +=
            item.cliques_previa;

          return total;
        },
        {
          cursos: 0,
          inscricoes: 0,
          previas: 0,
        }
      );
    }, [dados]);

  /* =======================================================
     TAXA GERAL
  ======================================================= */

  const taxaConversao =
    totais.cursos > 0
      ? (
          (totais.inscricoes /
            totais.cursos) *
          100
        ).toFixed(1)
      : "0.0";

  /* =======================================================
     TOTAL CURSOS VISTOS GA4
  ======================================================= */

  const totalCursosVistosGA =
    useMemo(() => {
      return analytics.desempenhoPorOrigem.reduce(
        (
          total,
          item
        ) =>
          total +
          item.cursosVistos,
        0
      );
    }, [
      analytics.desempenhoPorOrigem,
    ]);


/* =======================================================
   REDES SOCIAIS
======================================================= */

const redesSociais = useMemo(() => {
 const redes = [
  {
    nome: "Instagram",
    icon: FaInstagram,
  },
  {
    nome: "Facebook",
    icon: FaFacebookF,
  },
  {
    nome: "LinkedIn",
    icon: FaLinkedinIn,
  },
  {
    nome: "WhatsApp",
    icon: FaWhatsapp,
  },
  {
    nome: "TikTok",
    icon: FaTiktok,
  },
  {
    nome: "YouTube",
    icon: FaYoutube,
  },
];

  return redes.map((rede) => {
    const dadosRede =
      analytics.origens.find(
        (item) =>
          item.origem.toLowerCase() ===
          rede.nome.toLowerCase()
      );

    return {
      ...rede,

      visitantes:
        dadosRede?.visitantes ?? 0,

      sessoes:
        dadosRede?.sessoes ?? 0,

      percentual:
        dadosRede?.percentual ?? 0,
    };
  });
}, [analytics.origens]);

  /* =======================================================
     INSCRIÇÃO POR ORIGEM DISPONÍVEL?
  ======================================================= */

  const temInscricoesPorOrigem =
    useMemo(() => {
      return analytics.desempenhoPorOrigem.some(
        (item) =>
          typeof item.inscricoes ===
          "number"
      );
    }, [
      analytics.desempenhoPorOrigem,
    ]);

  /* =======================================================
     LOADING INICIAL
  ======================================================= */

  if (
    carregando &&
    !carregadoUmaVez
  ) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-6 md:p-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex items-center gap-3 text-zinc-500">
              <RefreshCw
                size={20}
                className="animate-spin"
              />

              Carregando relatórios...
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1450px]">

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">

          <div>
            <Link
              href="/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              <ArrowLeft
                size={16}
              />

              Voltar para o Dashboard
            </Link>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#667cf8]">
              <BarChart3
                size={17}
              />

              Relatórios
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
              Relatórios e aquisição de visitantes
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              Acompanhe de onde os visitantes chegam,
              quais páginas atraem mais acessos e como
              eles interagem com os treinamentos.
            </p>
          </div>

          {/* ATUALIZAR */}

          <button
            type="button"
            disabled={
              carregando ||
              carregandoAnalytics
            }
            onClick={() =>
              void carregarTudo(
                periodoAplicado.inicio,
                periodoAplicado.fim,
                periodoAplicado.label
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                carregando ||
                carregandoAnalytics
                  ? "animate-spin"
                  : ""
              }
            />

            Atualizar dados
          </button>

        </div>

        {/* =================================================
            FILTRO DE PERÍODO
        ================================================= */}

        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">
                <CalendarDays
                  size={20}
                />
              </div>

              <div>
                <h2 className="font-bold text-zinc-900">
                  Filtrar por período
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  O mesmo período será aplicado ao Google Analytics e aos dados internos dos treinamentos.
                </p>
              </div>

            </div>

            {/* BOTÕES RÁPIDOS */}

            <div className="flex flex-wrap gap-2">

              <PresetButton
                ativo={
                  periodoAplicado.label ===
                  "Todo o período"
                }
                onClick={
                  aplicarTodoPeriodo
                }
              >
                Todo o período
              </PresetButton>

              <PresetButton
                ativo={
                  periodoAplicado.label ===
                  "Hoje"
                }
                onClick={
                  aplicarHoje
                }
              >
                Hoje
              </PresetButton>

              <PresetButton
                ativo={
                  periodoAplicado.label ===
                  "Últimos 7 dias"
                }
                onClick={
                  aplicarUltimos7Dias
                }
              >
                Últimos 7 dias
              </PresetButton>

              <PresetButton
                ativo={
                  periodoAplicado.label ===
                  "Últimos 30 dias"
                }
                onClick={
                  aplicarUltimos30Dias
                }
              >
                Últimos 30 dias
              </PresetButton>

              <PresetButton
                ativo={
                  periodoAplicado.label ===
                  "Este mês"
                }
                onClick={
                  aplicarEsteMes
                }
              >
                Este mês
              </PresetButton>

            </div>

            {/* FILTRO MANUAL */}

            <div className="grid gap-4 border-t border-zinc-100 pt-5 md:grid-cols-[1fr_1fr_auto] md:items-end">

              <div>
                <label
                  htmlFor="data-inicio"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Data inicial
                </label>

                <input
                  id="data-inicio"
                  type="date"
                  value={
                    dataInicio
                  }
                  max={
                    dataFim ||
                    hoje
                  }
                  onChange={(
                    event
                  ) =>
                    setDataInicio(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-[#667cf8] focus:ring-4 focus:ring-[#667cf8]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="data-fim"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500"
                >
                  Data final
                </label>

                <input
                  id="data-fim"
                  type="date"
                  value={
                    dataFim
                  }
                  min={
                    dataInicio ||
                    undefined
                  }
                  max={
                    hoje
                  }
                  onChange={(
                    event
                  ) =>
                    setDataFim(
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-[#667cf8] focus:ring-4 focus:ring-[#667cf8]/10"
                />
              </div>

              <button
                type="button"
                disabled={
                  carregando ||
                  carregandoAnalytics
                }
                onClick={
                  aplicarFiltroPersonalizado
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#667cf8] px-6 text-sm font-semibold text-white transition hover:bg-[#586ee8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aplicar filtro
              </button>

            </div>

            <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">

              Período exibido:{" "}

              <strong className="text-zinc-900">
                {
                  periodoAplicado.label
                }
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            ERRO SUPABASE
        ================================================= */}

        {erro && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível carregar os relatórios internos:{" "}
            {erro}
          </div>
        )}

        {/* =================================================
            ERRO ANALYTICS
        ================================================= */}

        {erroAnalytics && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Não foi possível carregar o Google Analytics:{" "}
            {erroAnalytics}
          </div>
        )}

        {/* =================================================
            AQUISIÇÃO
        ================================================= */}

        <section className="mb-10">

          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

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

            {carregandoAnalytics && (
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />

                Atualizando GA4...
              </div>
            )}

          </div>

          {/* =================================================
              MÉTRICAS GA4
          ================================================= */}

          <div className="mb-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              titulo="Visitantes"
              valor={
                formatarNumero(
                  analytics.resumo.visitantes
                )
              }
              descricao="Usuários ativos no período"
              icon={Users}
            />

            <MetricCard
              titulo="Sessões"
              valor={
                formatarNumero(
                  analytics.resumo.sessoes
                )
              }
              descricao="Visitas iniciadas no site"
              icon={Activity}
            />

            <MetricCard
              titulo="Visualizações"
              valor={
                formatarNumero(
                  analytics.resumo.visualizacoes
                )
              }
              descricao="Visualizações de páginas do site"
              icon={Eye}
            />

            <MetricCard
              titulo="Cursos vistos"
              valor={
                formatarNumero(
                  totalCursosVistosGA
                )
              }
              descricao="Visualizações em páginas /cursos/*"
              icon={GraduationCap}
            />

          </div>


{/* =================================================
    REDES SOCIAIS
================================================= */}

<div className="mb-6">

  <div className="mb-4">
    <h3 className="text-lg font-bold text-zinc-900">
      Redes sociais
    </h3>

    <p className="mt-1 text-sm text-zinc-500">
      Visitantes e sessões originados das principais redes sociais.
    </p>
  </div>

  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

    {redesSociais.map((rede) => {
      const Icon = rede.icon;

      return (
        <article
          key={rede.nome}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
        >

          <div className="mb-4 flex items-center justify-between">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">
              <Icon size={19} />
            </div>

            {rede.percentual > 0 && (
              <span className="rounded-full bg-[#667cf8]/10 px-2.5 py-1 text-xs font-bold text-[#667cf8]">
                {rede.percentual}%
              </span>
            )}

          </div>

          <strong className="block text-sm font-bold text-zinc-900">
            {rede.nome}
          </strong>

          <div className="mt-4 flex items-end justify-between gap-3">

            <div>
              <strong className="block text-2xl font-bold tracking-tight text-zinc-950">
                {formatarNumero(
                  rede.visitantes
                )}
              </strong>

              <span className="mt-1 block text-xs text-zinc-400">
                visitantes
              </span>
            </div>

            <div className="text-right">
              <strong className="block text-sm font-bold text-zinc-700">
                {formatarNumero(
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
    })}

  </div>

</div>

          {/* =================================================
              ORIGENS + CANAIS
          ================================================= */}

          <div className="mb-6 grid gap-6 xl:grid-cols-2">

            {/* ===============================================
                DE ONDE VIERAM
            =============================================== */}

            <AnalyticsCard
              titulo="De onde vieram"
              descricao="Participação das origens nas sessões do site."
              icon={Globe2}
            >
              {analytics.origens.length ===
              0 ? (
                <AnalyticsEmpty />
              ) : (
                <div className="space-y-5">

                  {analytics.origens
                    .slice(0, 10)
                    .map(
                      (item) => (
                        <div
                          key={
                            item.origem
                          }
                        >
                          <div className="mb-2 flex items-center justify-between gap-4">

                            <div>
                              <strong className="text-sm text-zinc-800">
                                {
                                  item.origem
                                }
                              </strong>

                              <span className="ml-2 text-xs text-zinc-400">
                                {formatarNumero(
                                  item.sessoes
                                )}{" "}
                                sessões
                              </span>
                            </div>

                            <strong className="text-sm text-[#667cf8]">
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
                      )
                    )}

                </div>
              )}
            </AnalyticsCard>

            {/* ===============================================
                CANAIS
            =============================================== */}

            <AnalyticsCard
              titulo="Canais de aquisição"
              descricao="Como o GA4 classifica o tipo de tráfego recebido."
              icon={Network}
            >
              {analytics.canais.length ===
              0 ? (
                <AnalyticsEmpty />
              ) : (
                <div className="divide-y divide-zinc-100">

                  {analytics.canais
                    .slice(0, 10)
                    .map(
                      (item) => (
                        <div
                          key={
                            item.canal
                          }
                          className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                        >

<div
  key={item.origemMidia}
  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
>
  <div>

    <div className="flex items-center gap-2">

      <span className="text-sm font-semibold text-zinc-800">
        {item.canal}
      </span>

      {item.canal ===
        "Unassigned" && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
          verificar
        </span>
      )}

    </div>

    <div className="mt-1 text-xs text-zinc-400">
      {item.origemMidia}
    </div>

  </div>

  <strong className="text-sm text-zinc-950">
    {formatarNumero(
      item.sessoes
    )}
  </strong>
</div>

                        </div>
                      )
                    )}

                </div>
              )}
            </AnalyticsCard>

          </div>

          {/* =================================================
              PÁGINAS DE ENTRADA
          ================================================= */}

          <AnalyticsCard
            titulo="Páginas de entrada mais acessadas"
            descricao="Primeira página acessada pelos visitantes em cada sessão."
            icon={Route}
          >
            {analytics.paginasEntrada.length ===
            0 ? (
              <AnalyticsEmpty />
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[650px]">

                  <thead>
                    <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">

                      <th className="pb-3">
                        Página de entrada
                      </th>

                      <th className="pb-3 text-right">
                        Sessões
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {analytics.paginasEntrada
                      .slice(0, 10)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <tr
                            key={`${item.pagina}-${index}`}
                            className="border-b border-zinc-100 last:border-0"
                          >

                            <td className="py-4">

                              <div className="font-semibold text-zinc-800">
                                {formatarPaginaEntrada(
                                  item.pagina,
                                  dados
                                )}
                              </div>

                              <div className="mt-1 text-xs text-zinc-400">
                                {
                                  item.pagina
                                }
                              </div>

                            </td>

                            <td className="py-4 text-right">

                              <strong className="text-zinc-900">
                                {formatarNumero(
                                  item.sessoes
                                )}
                              </strong>

                            </td>

                          </tr>
                        )
                      )}

                  </tbody>

                </table>

              </div>
            )}
          </AnalyticsCard>

          {/* =================================================
              DESEMPENHO POR ORIGEM
          ================================================= */}

          <div className="mt-6">

            <AnalyticsCard
              titulo="Desempenho por origem"
              descricao="Compare quem trouxe visitantes e quantas páginas de cursos foram visualizadas."
              icon={TrendingUp}
            >

              {!temInscricoesPorOrigem && (
                <div className="mb-5 rounded-xl border border-[#667cf8]/15 bg-[#667cf8]/5 px-4 py-3 text-xs leading-5 text-zinc-600">
                  <strong className="text-zinc-800">
                    Inscrições e conversão por origem:
                  </strong>{" "}
                  serão preenchidas no próximo passo,
                  quando enviarmos o evento{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-semibold text-[#667cf8]">
                    inscricao_click
                  </code>{" "}
                  também para o GA4.
                </div>
              )}

              {analytics.desempenhoPorOrigem.length ===
              0 ? (
                <AnalyticsEmpty />
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[850px]">

                    <thead>
                      <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">

                        <th className="pb-3">
                          Origem
                        </th>

                        <th className="pb-3 text-center">
                          Visitantes
                        </th>

                        <th className="pb-3 text-center">
                          Cursos vistos
                        </th>

                        <th className="pb-3 text-center">
                          Inscrições
                        </th>

                        <th className="pb-3 text-center">
                          Conversão
                        </th>

                      </tr>
                    </thead>

                    <tbody>

                      {analytics.desempenhoPorOrigem
                        .slice(0, 15)
                        .map(
                          (item) => (
                            <tr
                              key={
                                item.origem
                              }
                              className="border-b border-zinc-100 last:border-0"
                            >

                              <td className="py-4">

                                <strong className="text-sm text-zinc-800">
                                  {
                                    item.origem
                                  }
                                </strong>

                              </td>

                              <td className="py-4 text-center">

                                <strong className="text-zinc-900">
                                  {formatarNumero(
                                    item.visitantes
                                  )}
                                </strong>

                              </td>

                              <td className="py-4 text-center">

                                <strong className="text-zinc-900">
                                  {formatarNumero(
                                    item.cursosVistos
                                  )}
                                </strong>

                              </td>

                              <td className="py-4 text-center">

                                {typeof item.inscricoes ===
                                "number" ? (
                                  <strong className="text-zinc-900">
                                    {formatarNumero(
                                      item.inscricoes
                                    )}
                                  </strong>
                                ) : (
                                  <span className="text-zinc-300">
                                    —
                                  </span>
                                )}

                              </td>

                              <td className="py-4 text-center">

                                {typeof item.conversao ===
                                "number" ? (
                                  <span className="inline-flex min-w-[65px] justify-center rounded-full bg-[#667cf8]/10 px-3 py-1.5 text-xs font-bold text-[#667cf8]">
                                    {
                                      item.conversao
                                    }
                                    %
                                  </span>
                                ) : (
                                  <span className="text-zinc-300">
                                    —
                                  </span>
                                )}

                              </td>

                            </tr>
                          )
                        )}

                    </tbody>

                  </table>

                </div>
              )}

            </AnalyticsCard>

          </div>

        </section>

        {/* =================================================
            RELATÓRIOS INTERNOS
        ================================================= */}

        <section>

          <div className="mb-5">

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#667cf8]">
              <MousePointerClick
                size={16}
              />

              Dados internos
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
              Desempenho dos treinamentos
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Eventos registrados diretamente pelo sistema no Supabase.
            </p>

          </div>

          {/* =================================================
              CARDS SUPABASE
          ================================================= */}

          <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

            <MetricCard
              titulo="Cliques nos treinamentos"
              valor={
                totais.cursos
              }
              descricao="Acessos às páginas dos cursos"
              icon={
                MousePointerClick
              }
            />

            <MetricCard
              titulo="Cliques em prévia (vídeo)"
              valor={
                totais.previas
              }
              descricao="Aberturas do vídeo de apresentação"
              icon={Eye}
            />

            <MetricCard
              titulo="Cliques em inscrição"
              valor={
                totais.inscricoes
              }
              descricao='Cliques em "Inscreva-se agora"'
              icon={
                GraduationCap
              }
            />

            <MetricCard
              titulo="Taxa de inscrição"
              valor={`${taxaConversao}%`}
              descricao="Inscrições ÷ acessos ao curso"
              icon={
                TrendingUp
              }
            />

          </div>

          {/* =================================================
              TABELA SUPABASE
          ================================================= */}

          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

            <div className="flex flex-col justify-between gap-3 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-center">

              <div>
                <h2 className="text-lg font-bold text-zinc-900">
                  Desempenho por treinamento
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {periodoAplicado.label ===
                  "Todo o período"
                    ? "Dados acumulados desde o início da coleta."
                    : "Dados referentes ao período selecionado."}
                </p>
              </div>

              <div className="rounded-full bg-[#667cf8]/10 px-3 py-1.5 text-xs font-semibold text-[#667cf8]">
                {
                  periodoAplicado.label
                }
              </div>

            </div>

            {carregando ? (
              <div className="flex min-h-[280px] items-center justify-center">

                <div className="flex items-center gap-3 text-sm text-zinc-500">

                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />

                  Atualizando relatório...

                </div>

              </div>
            ) : dados.length ===
              0 ? (

              <div className="px-6 py-16 text-center">

                <BarChart3
                  size={34}
                  className="mx-auto text-zinc-300"
                />

                <h3 className="mt-4 font-semibold text-zinc-800">
                  Nenhum dado registrado
                </h3>

                <p className="mt-1 text-sm text-zinc-500">
                  {periodoAplicado.label ===
                  "Todo o período"
                    ? "Ainda não existem interações registradas."
                    : "Não existem interações registradas neste período."}
                </p>

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>
                    <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">

                      <th className="px-6 py-4">
                        Treinamento
                      </th>

                      <th className="px-5 py-4 text-center">
                        Cliques
                      </th>

                      <th className="px-5 py-4 text-center">
                        Prévia
                      </th>

                      <th className="px-5 py-4 text-center">
                        Inscreva-se
                      </th>

                      <th className="px-5 py-4 text-center">
                        Conversão
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {dados.map(
                      (item) => {
                        const cliques =
                          item.cliques_curso;

                        const previas =
                          item.cliques_previa;

                        const inscricoes =
                          item.cliques_inscricao;

                        const conversao =
                          cliques > 0
                            ? (
                                (inscricoes /
                                  cliques) *
                                100
                              ).toFixed(
                                1
                              )
                            : "0.0";

                        return (
                          <tr
                            key={
                              item.curso_slug
                            }
                            className="border-t border-zinc-100 transition hover:bg-zinc-50/70"
                          >

                            <td className="px-6 py-5">

                              <Link
                                href={`/${item.curso_slug}`}
                                className="font-semibold text-zinc-900 transition hover:text-[#667cf8]"
                              >
                                {
                                  item.curso_titulo
                                }
                              </Link>

                              <div className="mt-1 text-xs text-zinc-400">
                                /
                                {
                                  item.curso_slug
                                }
                              </div>

                            </td>

                            <td className="px-5 py-5 text-center">
                              <strong className="text-zinc-800">
                                {
                                  cliques
                                }
                              </strong>
                            </td>

                            <td className="px-5 py-5 text-center">
                              <strong className="text-zinc-800">
                                {
                                  previas
                                }
                              </strong>
                            </td>

                            <td className="px-5 py-5 text-center">
                              <strong className="text-zinc-800">
                                {
                                  inscricoes
                                }
                              </strong>
                            </td>

                            <td className="px-5 py-5 text-center">

                              <span className="inline-flex min-w-[65px] justify-center rounded-full bg-[#667cf8]/10 px-3 py-1.5 text-xs font-bold text-[#667cf8]">
                                {
                                  conversao
                                }
                                %
                              </span>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

        </section>

      </div>
    </main>
  );
}

/* =========================================================
   BOTÃO DE PERÍODO
========================================================= */

function PresetButton({
  children,
  ativo,
  onClick,
}: {
  children: React.ReactNode;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex h-9 items-center justify-center
        rounded-lg border px-3.5 text-sm font-medium
        transition
        ${
          ativo
            ? "border-[#667cf8] bg-[#667cf8] text-white"
            : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
        }
      `}
    >
      {children}
    </button>
  );
}

/* =========================================================
   CARD MÉTRICA
========================================================= */

function MetricCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
}: {
  titulo: string;
  valor: number | string;
  descricao: string;
  icon: React.ElementType;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-zinc-500">
            {titulo}
          </p>

          <strong className="mt-3 block text-3xl font-bold tracking-tight text-zinc-950">
            {valor}
          </strong>

          <span className="mt-2 block text-xs leading-5 text-zinc-400">
            {descricao}
          </span>

        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">

          <Icon
            size={21}
          />

        </div>

      </div>

    </article>
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
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

      <div className="mb-6 flex items-start gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">
          <Icon
            size={19}
          />
        </div>

        <div>
          <h3 className="font-bold text-zinc-900">
            {titulo}
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {descricao}
          </p>
        </div>

      </div>

      {children}

    </article>
  );
}

/* =========================================================
   ANALYTICS SEM DADOS
========================================================= */

function AnalyticsEmpty() {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center rounded-xl bg-zinc-50 px-5 py-8 text-center">

      <BarChart3
        size={28}
        className="text-zinc-300"
      />

      <p className="mt-3 text-sm font-medium text-zinc-600">
        Ainda não há dados processados
      </p>

      <span className="mt-1 max-w-md text-xs leading-5 text-zinc-400">
        O GA4 foi instalado recentemente. Os dados aparecerão aqui assim que o Google concluir o processamento.
      </span>

    </div>
  );
}