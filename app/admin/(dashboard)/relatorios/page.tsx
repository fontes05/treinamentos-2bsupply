"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Eye,
  GraduationCap,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TIPOS
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
   HELPERS
========================================================= */

function normalizarRelatorio(
  dados: RelatorioRPC[]
): Relatorio[] {
  return dados.map((item) => ({
    curso_slug:
      item.curso_slug,

    curso_titulo:
      item.curso_titulo,

    cliques_curso:
      Number(
        item.cliques_curso ??
          0
      ),

    cliques_inscricao:
      Number(
        item.cliques_inscricao ??
          0
      ),

    cliques_previa:
      Number(
        item.cliques_previa ??
          0
      ),
  }));
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
    ).formatToParts(
      date
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month"
    )?.value ?? "";

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day"
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
    date.getDate() -
      dias
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
  const [
    year,
    month,
  ] =
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
   PÁGINA
========================================================= */

export default function RelatoriosPage() {
  const [
    dados,
    setDados,
  ] =
    useState<
      Relatorio[]
    >([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    carregadoUmaVez,
    setCarregadoUmaVez,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

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
  ] =
    useState("");

  const [
    dataFim,
    setDataFim,
  ] =
    useState("");

  const [
    periodoAplicado,
    setPeriodoAplicado,
  ] =
    useState<PeriodoAplicado>(
      {
        inicio: "",
        fim: "",
        label:
          "Todo o período",
      }
    );

  /* =======================================================
     CARREGAR RELATÓRIOS
  ======================================================= */

  const carregarRelatorios =
    useCallback(
      async (
        inicio = "",
        fim = "",
        label =
          "Todo o período"
      ) => {
        setCarregando(
          true
        );

        setErro("");

        try {
          const supabase =
            createClient();

          let dadosRPC:
            | RelatorioRPC[]
            | null =
            null;

          /* =============================================
             TODO O PERÍODO

             IMPORTANTE:
             usa a função ORIGINAL que já funcionava.
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

            if (
              error
            ) {
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

             Usa a nova RPC que recebe datas.
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

            if (
              error
            ) {
              throw new Error(
                error.message
              );
            }

            dadosRPC =
              (data ??
                []) as RelatorioRPC[];
          }

          /* =============================================
             NORMALIZAR NÚMEROS
          ============================================= */

          const relatorio =
            normalizarRelatorio(
              dadosRPC ??
                []
            );

          /* =============================================
             ORDENAR POR CLIQUES
          ============================================= */

          relatorio.sort(
            (
              a,
              b
            ) =>
              b.cliques_curso -
              a.cliques_curso
          );

          setDados(
            relatorio
          );

          setPeriodoAplicado(
            {
              inicio,
              fim,
              label,
            }
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar relatórios:",
            error
          );

          setErro(
            error instanceof
              Error
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
     PRIMEIRO CARREGAMENTO

     SEM DATAS = RPC ANTIGA
  ======================================================= */

  useEffect(() => {
    void carregarRelatorios(
      "",
      "",
      "Todo o período"
    );
  }, [
    carregarRelatorios,
  ]);

  /* =======================================================
     TODO O PERÍODO
  ======================================================= */

  function aplicarTodoPeriodo() {
    setDataInicio("");
    setDataFim("");

    void carregarRelatorios(
      "",
      "",
      "Todo o período"
    );
  }

  /* =======================================================
     HOJE
  ======================================================= */

  function aplicarHoje() {
    setDataInicio(
      hoje
    );

    setDataFim(
      hoje
    );

    void carregarRelatorios(
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

    setDataFim(
      hoje
    );

    void carregarRelatorios(
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

    setDataFim(
      hoje
    );

    void carregarRelatorios(
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

    setDataFim(
      hoje
    );

    void carregarRelatorios(
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

    void carregarRelatorios(
      dataInicio,
      dataFim,
      label
    );
  }

  /* =======================================================
     TOTAIS
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
    }, [
      dados,
    ]);

  /* =======================================================
     TAXA GERAL
  ======================================================= */

  const taxaConversao =
    totais.cursos >
    0
      ? (
          (totais.inscricoes /
            totais.cursos) *
          100
        ).toFixed(
          1
        )
      : "0.0";

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
                size={
                  20
                }
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
                size={
                  16
                }
              />

              Voltar para o Dashboard
            </Link>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#667cf8]">
              <BarChart3
                size={
                  17
                }
              />

              Relatórios
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
              Desempenho dos treinamentos
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Acompanhe o interesse dos usuários,
              acessos às prévias e cliques para
              inscrição em cada treinamento.
            </p>
          </div>

          {/* ATUALIZAR */}

          <button
            type="button"
            disabled={
              carregando
            }
            onClick={() =>
              void carregarRelatorios(
                periodoAplicado.inicio,
                periodoAplicado.fim,
                periodoAplicado.label
              )
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={
                16
              }
              className={
                carregando
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

            {/* TÍTULO */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#667cf8]/10 text-[#667cf8]">
                <CalendarDays
                  size={
                    20
                  }
                />
              </div>

              <div>
                <h2 className="font-bold text-zinc-900">
                  Filtrar por período
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Selecione um período rápido ou escolha as datas manualmente.
                </p>
              </div>

            </div>

            {/* =================================================
                BOTÕES RÁPIDOS
            ================================================= */}

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

            {/* =================================================
                FILTRO MANUAL
            ================================================= */}

            <div className="grid gap-4 border-t border-zinc-100 pt-5 md:grid-cols-[1fr_1fr_auto] md:items-end">

              {/* DATA INICIAL */}

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

              {/* DATA FINAL */}

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

              {/* APLICAR */}

              <button
                type="button"
                disabled={
                  carregando
                }
                onClick={
                  aplicarFiltroPersonalizado
                }
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#667cf8] px-6 text-sm font-semibold text-white transition hover:bg-[#586ee8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Aplicar filtro
              </button>

            </div>

            {/* =================================================
                PERÍODO ATUAL
            ================================================= */}

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
            ERRO
        ================================================= */}

        {erro && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi possível carregar os relatórios:{" "}
            {erro}
          </div>
        )}

        {/* =================================================
            CARDS
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
            icon={
              Eye
            }
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
            TABELA
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

          {/* TOPO TABELA */}

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

          {/* =================================================
              CARREGANDO
          ================================================= */}

          {carregando ? (
            <div className="flex min-h-[280px] items-center justify-center">

              <div className="flex items-center gap-3 text-sm text-zinc-500">
                <RefreshCw
                  size={
                    18
                  }
                  className="animate-spin"
                />

                Atualizando relatório...
              </div>

            </div>
          ) : dados.length ===
            0 ? (

            /* =================================================
               VAZIO
            ================================================= */

            <div className="px-6 py-16 text-center">

              <BarChart3
                size={
                  34
                }
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

            /* =================================================
               TABELA
            ================================================= */

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
                    (
                      item
                    ) => {
                      const cliques =
                        item.cliques_curso;

                      const previas =
                        item.cliques_previa;

                      const inscricoes =
                        item.cliques_inscricao;

                      const conversao =
                        cliques >
                        0
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

                          {/* CURSO */}

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

                          {/* CLIQUES */}

                          <td className="px-5 py-5 text-center">
                            <strong className="text-zinc-800">
                              {
                                cliques
                              }
                            </strong>
                          </td>

                          {/* PRÉVIA */}

                          <td className="px-5 py-5 text-center">
                            <strong className="text-zinc-800">
                              {
                                previas
                              }
                            </strong>
                          </td>

                          {/* INSCRIÇÕES */}

                          <td className="px-5 py-5 text-center">
                            <strong className="text-zinc-800">
                              {
                                inscricoes
                              }
                            </strong>
                          </td>

                          {/* CONVERSÃO */}

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
  children:
    React.ReactNode;

  ativo: boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
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

  valor:
    | number
    | string;

  descricao: string;

  icon:
    React.ElementType;
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
            size={
              21
            }
          />

        </div>

      </div>

    </article>
  );
}