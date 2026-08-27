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
  Eye,
  GraduationCap,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Relatorio = {
  curso_slug: string;
  curso_titulo: string;
  cliques_curso: number | string;
  cliques_inscricao: number | string;
  cliques_previa: number | string;
};

export default function RelatoriosPage() {
  const [
    dados,
    setDados,
  ] = useState<Relatorio[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  /* =====================================================
     CARREGAR RELATÓRIOS
  ===================================================== */

  const carregarRelatorios =
    useCallback(async () => {
      setCarregando(true);
      setErro("");

      try {
        const supabase =
          createClient();

       const {
  data,
  error,
} = await supabase.rpc(
  "treinamentos_relatorios_admin"
);

        if (error) {
          throw new Error(
            error.message
          );
        }

        setDados(
          (data ??
            []) as Relatorio[]
        );
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
        setCarregando(false);
      }
    }, []);

  useEffect(() => {
    void carregarRelatorios();
  }, [carregarRelatorios]);

  /* =====================================================
     TOTAIS
  ===================================================== */

  const totais = useMemo(() => {
    return dados.reduce(
      (
        total,
        item
      ) => {
        total.cursos +=
          Number(
            item.cliques_curso
          );

        total.inscricoes +=
          Number(
            item.cliques_inscricao
          );

        total.previas +=
          Number(
            item.cliques_previa
          );

        return total;
      },
      {
        cursos: 0,
        inscricoes: 0,
        previas: 0,
      }
    );
  }, [dados]);

  /* =====================================================
     TAXA GERAL
  ===================================================== */

  const taxaConversao =
    totais.cursos > 0
      ? (
          (totais.inscricoes /
            totais.cursos) *
          100
        ).toFixed(1)
      : "0.0";

  /* =====================================================
     LOADING
  ===================================================== */

  if (carregando) {
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

  /* =====================================================
     ERRO
  ===================================================== */

  if (erro) {
    return (
      <main className="min-h-screen bg-[#f7f8fa] p-6 md:p-10">
        <div className="mx-auto max-w-[1000px]">
          <div className="rounded-2xl border border-red-200 bg-white p-8">
            <h1 className="text-xl font-bold text-zinc-900">
              Não foi possível carregar os relatórios
            </h1>

            <p className="mt-3 text-sm text-red-600">
              {erro}
            </p>

            <button
              type="button"
              onClick={() =>
                void carregarRelatorios()
              }
              className="mt-5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-5 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-[1450px]">

        {/* =================================================
            TOPO
        ================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Link
              href="/admin"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              <ArrowLeft size={16} />

              Voltar para o site
            </Link>

            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#667cf8]">
              <BarChart3 size={17} />

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

          <button
            type="button"
            onClick={() =>
              void carregarRelatorios()
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <RefreshCw size={16} />

            Atualizar dados
          </button>
        </div>

        {/* =================================================
            CARDS
        ================================================= */}

        <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            titulo="Cliques nos treinamentos"
            valor={totais.cursos}
            descricao="Acessos às páginas dos cursos"
            icon={MousePointerClick}
          />

          <MetricCard
            titulo="Cliques em prévia (vídeo)"
            valor={totais.previas}
            descricao="Aberturas do vídeo de apresentação"
            icon={Eye}
          />

          <MetricCard
            titulo="Cliques em inscrição"
            valor={totais.inscricoes}
            descricao='Cliques em "Inscreva-se agora"'
            icon={GraduationCap}
          />

          <MetricCard
            titulo="Taxa de inscrição"
            valor={`${taxaConversao}%`}
            descricao="Inscrições ÷ acessos ao curso"
            icon={TrendingUp}
          />

        </div>

        {/* =================================================
            TABELA
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

          <div className="border-b border-zinc-100 px-6 py-5">
            <h2 className="text-lg font-bold text-zinc-900">
              Desempenho por treinamento
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Dados acumulados desde o início da coleta.
            </p>
          </div>

          {dados.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <BarChart3
                size={34}
                className="mx-auto text-zinc-300"
              />

              <h3 className="mt-4 font-semibold text-zinc-800">
                Nenhum dado registrado
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Os dados aparecerão aqui assim que
                os visitantes começarem a interagir
                com os treinamentos.
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
                        Number(
                          item.cliques_curso
                        );

                      const previas =
                        Number(
                          item.cliques_previa
                        );

                      const inscricoes =
                        Number(
                          item.cliques_inscricao
                        );

                      const conversao =
                        cliques > 0
                          ? (
                              (inscricoes /
                                cliques) *
                              100
                            ).toFixed(1)
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
                              {cliques}
                            </strong>
                          </td>

                          <td className="px-5 py-5 text-center">
                            <strong className="text-zinc-800">
                              {previas}
                            </strong>
                          </td>

                          <td className="px-5 py-5 text-center">
                            <strong className="text-zinc-800">
                              {inscricoes}
                            </strong>
                          </td>

                          <td className="px-5 py-5 text-center">
                            <span className="inline-flex min-w-[65px] justify-center rounded-full bg-[#667cf8]/10 px-3 py-1.5 text-xs font-bold text-[#667cf8]">
                              {conversao}%
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
          <Icon size={21} />
        </div>

      </div>

    </article>
  );
}