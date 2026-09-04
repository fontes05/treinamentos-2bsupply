"use client";

import Link from "next/link";

import {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowUpRight,
  BookOpen,
  Clock,
  Eye,
  GraduationCap,
  LoaderCircle,
  MousePointerClick,
} from "lucide-react";

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
   TIPOS
========================================================= */

type Curso = {
  id: string;
  titulo: string;
  slug: string;
  categoria_id: number | null;
  status: string;
  destaque: boolean;
  created_at: string;
};

type Categoria = {
  id: number;
  nome: string;
};

type EventoAnalytics = {
  curso_slug: string | null;
  curso_titulo: string | null;
  created_at: string;
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

/* =========================================================
   HELPERS
========================================================= */

function formatarData(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatarDataHora(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatarDataCurta(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "America/Sao_Paulo",
  })
    .format(new Date(value))
    .replace(".", "");
}

/* ---------------------------------------------------------
   CHAVE DO MÊS
--------------------------------------------------------- */

function getMonthKey(value: Date | string) {
  const date =
    typeof value === "string"
      ? new Date(value)
      : value;

  const parts =
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).formatToParts(date);

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

  return `${year}-${month}`;
}

/* ---------------------------------------------------------
   ÚLTIMOS 6 MESES
--------------------------------------------------------- */

function gerarUltimosSeisMeses() {
  const hoje = new Date();

  return Array.from(
    {
      length: 6,
    },
    (_, index) => {
      const date =
        new Date(
          hoje.getFullYear(),
          hoje.getMonth() -
            (5 - index),
          1
        );

      const label =
        new Intl.DateTimeFormat(
          "pt-BR",
          {
            month: "short",
            timeZone:
              "America/Sao_Paulo",
          }
        )
          .format(date)
          .replace(".", "");

      return {
        key: getMonthKey(date),
        mes:
          label.charAt(0).toUpperCase() +
          label.slice(1),
        inscricoes: 0,
      };
    }
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function AdminDashboardPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [cursos, setCursos] =
    useState<Curso[]>([]);

  const [
    metricas,
    setMetricas,
  ] = useState<Metricas>({
    inscricoes: 0,
    visitas: 0,
    previas: 0,
  });

  const [
    cursosMaisVisitados,
    setCursosMaisVisitados,
  ] = useState<
    CursoVisitado[]
  >([]);

  const [
    ultimasInscricoes,
    setUltimasInscricoes,
  ] = useState<
    UltimaInscricao[]
  >([]);

  const [
    inscricoesGrafico,
    setInscricoesGrafico,
  ] = useState<
    EventoAnalytics[]
  >([]);

  /* =======================================================
     CARREGAR DASHBOARD
  ======================================================= */

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      setLoading(true);
      setErro("");

      try {
        /* ===============================================
           DATA INICIAL DO GRÁFICO
        =============================================== */

        const inicioGrafico =
          new Date();

        inicioGrafico.setDate(1);
        inicioGrafico.setHours(
          0,
          0,
          0,
          0
        );

        inicioGrafico.setMonth(
          inicioGrafico.getMonth() -
            5
        );

        /* ===============================================
           CONSULTAS
        =============================================== */

        const [
          cursosResponse,
          categoriasResponse,
          inscricoesCountResponse,
          visitasCountResponse,
          previasCountResponse,
          visitasResponse,
          ultimasInscricoesResponse,
          graficoResponse,
        ] = await Promise.all([
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
                ascending: false,
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

          /* TOTAL CLIQUES INSCRIÇÃO */

          supabase
            .from(
              "treinamentos_analytics"
            )
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq(
              "evento",
              "inscricao_click"
            ),

          /* TOTAL VISITAS */

          supabase
            .from(
              "treinamentos_analytics"
            )
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq(
              "evento",
              "curso_click"
            ),

          /* TOTAL PRÉVIAS */

          supabase
            .from(
              "treinamentos_analytics"
            )
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq(
              "evento",
              "previa_click"
            ),

          /* VISITAS PARA RANKING */

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
              "curso_click"
            ),

          /* ÚLTIMAS INSCRIÇÕES */

         supabase
  .from("treinamentos_analytics")
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
      ascending: false,
    }
  )
  .limit(5),

          /* GRÁFICO */

supabase
  .from("treinamentos_analytics")
  .select(`
    curso_slug,
    curso_titulo,
    created_at
  `)
  .eq(
    "evento",
    "inscricao_click"
  )
  .gte(
    "created_at",
    inicioGrafico.toISOString()
  ),
        ]);

        /* ===============================================
           ERROS PRINCIPAIS
        =============================================== */

        const primeiroErro = [
          cursosResponse.error,
          inscricoesCountResponse.error,
          visitasCountResponse.error,
          previasCountResponse.error,
          visitasResponse.error,
          ultimasInscricoesResponse.error,
          graficoResponse.error,
        ].find(Boolean);

        if (primeiroErro) {
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

        if (!ativo) {
          return;
        }

        /* ===============================================
           CURSOS
        =============================================== */

        const listaCursos =
          (cursosResponse.data ??
            []) as Curso[];

        const listaCategorias =
          (categoriasResponse.data ??
            []) as Categoria[];

        setCursos(
          listaCursos
        );

        /* ===============================================
           MÉTRICAS
        =============================================== */

        setMetricas({
          inscricoes:
            inscricoesCountResponse.count ??
            0,

          visitas:
            visitasCountResponse.count ??
            0,

          previas:
            previasCountResponse.count ??
            0,
        });

        /* ===============================================
           MAP DE CATEGORIAS
        =============================================== */

        const categoriaMap =
          new Map<
            number,
            string
          >();

        listaCategorias.forEach(
          (categoria) => {
            categoriaMap.set(
              categoria.id,
              categoria.nome
            );
          }
        );

        /* ===============================================
           MAP DE CURSOS
        =============================================== */

        const cursoMap =
          new Map<
            string,
            Curso
          >();

        listaCursos.forEach(
          (curso) => {
            cursoMap.set(
              curso.slug,
              curso
            );
          }
        );

        /* ===============================================
           CURSOS MAIS VISITADOS
        =============================================== */

        const visitas =
          (visitasResponse.data ??
            []) as EventoAnalytics[];

        const contagem =
          new Map<
            string,
            {
              titulo: string;
              visitas: number;
            }
          >();

        visitas.forEach(
  (evento) => {
    if (!evento.curso_slug) {
      return;
    }

    const atual =
      contagem.get(
        evento.curso_slug
      );

    if (atual) {
      atual.visitas += 1;
      return;
    }

    contagem.set(
      evento.curso_slug,
      {
        titulo:
          evento.curso_titulo ||
          evento.curso_slug,

        visitas: 1,
      }
    );
  }
);

        const ranking =
          Array.from(
            contagem.entries()
          )
            .map(
              ([
                slug,
                analytics,
              ]) => {
                const curso =
                  cursoMap.get(
                    slug
                  );

                return {
                  slug,

                  titulo:
                    curso?.titulo ||
                    analytics.titulo,

                  visitas:
                    analytics.visitas,

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
            .sort(
              (a, b) =>
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

        /* ===============================================
           ÚLTIMAS INSCRIÇÕES
        =============================================== */

       const listaUltimas =
  (
    ultimasInscricoesResponse.data ??
    []
  )
    .filter(
      (item) =>
        Boolean(
          item.curso_slug
        )
    )
    .map(
      (item) => ({
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

        /* ===============================================
           GRÁFICO
        =============================================== */

        setInscricoesGrafico(
          (
            graficoResponse.data ??
            []
          ) as EventoAnalytics[]
        );
      } catch (error) {
        console.error(
          "Erro ao carregar dashboard:",
          error
        );

        if (!ativo) {
          return;
        }

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o dashboard."
        );
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    void carregarDashboard();

    return () => {
      ativo = false;
    };
  }, [supabase]);

  /* =======================================================
     DADOS DOS CURSOS
  ======================================================= */

  const cursosPublicados =
    useMemo(
      () =>
        cursos.filter(
          (curso) =>
            curso.status ===
            "publicado"
        ).length,
      [cursos]
    );

  const cursosRascunho =
    useMemo(
      () =>
        cursos.filter(
          (curso) =>
            curso.status ===
            "rascunho"
        ).length,
      [cursos]
    );

  const cursosDestaque =
    useMemo(
      () =>
        cursos.filter(
          (curso) =>
            curso.destaque
        ).length,
      [cursos]
    );

  const cursoMaisRecente =
    cursos[0] ?? null;

  /* =======================================================
     GRÁFICO
  ======================================================= */

  const chartData =
    useMemo(() => {
      const meses =
        gerarUltimosSeisMeses();

      const mapa =
        new Map(
          meses.map(
            (item) => [
              item.key,
              0,
            ]
          )
        );

      inscricoesGrafico.forEach(
        (evento) => {
          const key =
            getMonthKey(
              evento.created_at
            );

          if (
            !mapa.has(key)
          ) {
            return;
          }

          mapa.set(
            key,
            (mapa.get(key) ?? 0) +
              1
          );
        }
      );

      return meses.map(
        (item) => ({
          ...item,

          inscricoes:
            mapa.get(
              item.key
            ) ?? 0,
        })
      );
    }, [
      inscricoesGrafico,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      {/* =====================================================
          CABEÇALHO
      ====================================================== */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Visão geral
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
            Dashboard
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Acompanhe o desempenho dos treinamentos e as últimas
            movimentações.
          </p>
        </div>

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
  <BookOpen size={17} />

  Novo curso
</Link>
      </div>

      {/* =====================================================
          ERRO
      ====================================================== */}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Não foi possível carregar alguns dados do Dashboard:
          {" "}
          {erro}
        </div>
      )}

      {/* =====================================================
          CARDS
      ====================================================== */}

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

      {/* =====================================================
          GRÁFICO + RESUMO
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* GRÁFICO */}

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
                : `${inscricoesGrafico.length} cliques`}
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

        {/* RESUMO */}

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

      {/* =====================================================
          CURSOS + ÚLTIMAS INSCRIÇÕES
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ===================================================
            CURSOS MAIS VISITADOS
        ==================================================== */}

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
  className="
    inline-flex h-9 items-center justify-center gap-2
    rounded-md px-3
    text-sm font-medium text-zinc-700
    transition-colors
    hover:bg-zinc-100
    hover:text-zinc-950
  "
>
  Ver todos

  <ArrowUpRight size={15} />
</Link>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : cursosMaisVisitados.length ===
              0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <Eye className="mb-3 h-8 w-8 text-zinc-300" />

                <p className="text-sm font-medium text-zinc-700">
                  Nenhuma visita registrada
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Os acessos aos cursos aparecerão aqui.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      Curso
                    </TableHead>

                    <TableHead>
                      Visitas
                    </TableHead>

                    <TableHead>
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {cursosMaisVisitados.map(
                    (curso) => (
                      <TableRow
                        key={
                          curso.slug
                        }
                      >
                        <TableCell>
                          <div>
                            <Link
                              href={`/cursos/${curso.slug}`}
                              className="font-medium text-zinc-900 transition hover:text-emerald-600"
                            >
                              {
                                curso.titulo
                              }
                            </Link>

                            <p className="mt-0.5 text-xs text-zinc-500">
                              {
                                curso.categoria
                              }
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="font-medium text-zinc-800">
                          {
                            curso.visitas
                          }
                        </TableCell>

                        <TableCell>
                          <StatusBadge
                            status={
                              curso.status
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* ===================================================
            ÚLTIMAS INSCRIÇÕES
        ==================================================== */}

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Últimas inscrições
              </CardTitle>

              <CardDescription>
                Últimos cliques nos links de inscrição dos cursos.
              </CardDescription>
            </div>

            <Link
  href="/admin/relatorios"
  className="
    inline-flex h-9 items-center justify-center gap-2
    rounded-md px-3
    text-sm font-medium text-zinc-700
    transition-colors
    hover:bg-zinc-100
    hover:text-zinc-950
  "
>
  Ver todas

  <ArrowUpRight size={15} />
</Link>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <LoaderCircle className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : ultimasInscricoes.length ===
              0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                <GraduationCap className="mb-3 h-8 w-8 text-zinc-300" />

                <p className="text-sm font-medium text-zinc-700">
                  Nenhuma inscrição registrada
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Os cliques nos links de inscrição aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {ultimasInscricoes.map(
                  (
                    inscricao,
                    index
                  ) => (
                    <div
                      key={`${inscricao.slug}-${inscricao.created_at}-${index}`}
                      className="flex items-center justify-between gap-4 rounded-lg px-2 py-3 transition hover:bg-zinc-50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <MousePointerClick
                            size={
                              18
                            }
                          />
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/cursos/${inscricao.slug}`}
                            className="block truncate text-sm font-medium text-zinc-900 transition hover:text-emerald-600"
                          >
                            {
                              inscricao.titulo
                            }
                          </Link>

                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            Clique no link de inscrição
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="flex items-center justify-end gap-1 text-xs font-medium text-zinc-600">
                          <Clock
                            size={
                              12
                            }
                          />

                          {formatarData(
                            inscricao.created_at
                          )}
                        </div>

                        <p className="mt-1 text-[11px] text-zinc-400">
                          {formatarDataHora(
                            inscricao.created_at
                          ).split(
                            " "
                          ).slice(
                            -1
                          )}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* =========================================================
   METRIC CARD
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
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">
              {title}
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
              {value}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            {icon}
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   SUMMARY ITEM
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
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-800">
          {label}
        </p>

        <p className="mt-1 truncate text-xs text-zinc-500">
          {detail}
        </p>
      </div>

      <p className="shrink-0 text-lg font-bold text-zinc-950">
        {value}
      </p>
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
    status === "publicado"
  ) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
        Publicado
      </Badge>
    );
  }

  if (
    status === "rascunho"
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

  if (
    status === "inativo"
  ) {
    return (
      <Badge
        variant="secondary"
        className="bg-red-50 text-red-700"
      >
        Inativo
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      {status}
    </Badge>
  );
}