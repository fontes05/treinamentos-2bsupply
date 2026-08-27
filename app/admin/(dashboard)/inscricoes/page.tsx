"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  Mail,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TIPOS
========================================================= */

type Inscricao = {
  id: string;
  nome: string;
  email: string;
  created_at: string;
};

/* =========================================================
   PÁGINA
========================================================= */

export default function InscricoesPage() {
  /* =======================================================
     SUPABASE
  ======================================================= */

  const supabase = useMemo(
    () => createClient(),
    []
  );

  /* =======================================================
     ESTADOS
  ======================================================= */

  const [inscricoes, setInscricoes] =
    useState<Inscricao[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [busca, setBusca] =
    useState("");

  const [erro, setErro] =
    useState<string | null>(null);

  /* =======================================================
     CARREGAR INSCRIÇÕES
  ======================================================= */

  const carregarInscricoes =
    useCallback(async () => {
      try {
        setLoading(true);
        setErro(null);

        const {
          data,
          error,
        } = await supabase
          .from(
            "treinamentos_newsletter"
          )
          .select(
            "id, nome, email, created_at"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        /* ===============================================
           ERRO DO SUPABASE
        =============================================== */

        if (error) {
          console.error(
            "Erro Supabase ao carregar inscrições:",
            {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
            }
          );

          setErro(
            `${error.message}${
              error.code
                ? ` (${error.code})`
                : ""
            }`
          );

          return;
        }

        /* ===============================================
           SUCESSO
        =============================================== */

        setInscricoes(
          (data ?? []) as Inscricao[]
        );
      } catch (error) {
        console.error(
          "Erro inesperado ao carregar inscrições:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as inscrições."
        );
      } finally {
        setLoading(false);
      }
    }, [supabase]);

  /* =======================================================
     CARREGAR AO ABRIR A PÁGINA
  ======================================================= */

  useEffect(() => {
    void carregarInscricoes();
  }, [carregarInscricoes]);

  /* =======================================================
     INSCRITOS HOJE
  ======================================================= */

  const inscritosHoje =
    useMemo(() => {
      const formatador =
        new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone:
              "America/Sao_Paulo",

            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        );

      const hoje =
        formatador.format(
          new Date()
        );

      return inscricoes.filter(
        (item) => {
          const dataCadastro =
            formatador.format(
              new Date(
                item.created_at
              )
            );

          return (
            dataCadastro === hoje
          );
        }
      ).length;
    }, [inscricoes]);

  /* =======================================================
     FILTRO / BUSCA
  ======================================================= */

  const inscricoesFiltradas =
    useMemo(() => {
      const termo = busca
        .trim()
        .toLowerCase();

      if (!termo) {
        return inscricoes;
      }

      return inscricoes.filter(
        (item) => {
          return (
            item.nome
              ?.toLowerCase()
              .includes(termo) ||
            item.email
              ?.toLowerCase()
              .includes(termo)
          );
        }
      );
    }, [busca, inscricoes]);

  /* =======================================================
     FORMATAR DATA
  ======================================================= */

  function formatarData(
    data: string
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
      new Date(data)
    );
  }

  /* =======================================================
     FORMATAR HORA
  ======================================================= */

  function formatarHora(
    data: string
  ) {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          "America/Sao_Paulo",
      }
    ).format(
      new Date(data)
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-[1500px] px-6 py-8 lg:px-10">

        {/* =================================================
            CABEÇALHO
        ================================================= */}

        <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-indigo-500">
              <Users className="h-4 w-4" />

              Inscrições
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
              Inscritos na newsletter
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Acompanhe as pessoas cadastradas para receber
              novidades, conteúdos e informações sobre os
              treinamentos da 2BSUPPLY.
            </p>
          </div>

          {/* BOTÃO ATUALIZAR */}

          <button
            type="button"
            onClick={() =>
              void carregarInscricoes()
            }
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />

            Atualizar
          </button>
        </div>

        {/* =================================================
            CARDS
        ================================================= */}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

          {/* TOTAL */}

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>

            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total de inscritos
            </p>

            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
              {inscricoes.length}
            </p>
          </div>

          {/* HOJE */}

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CalendarDays className="h-5 w-5" />
            </div>

            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Inscritos hoje
            </p>

            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
              {inscritosHoje}
            </p>
          </div>

          {/* CONTATOS */}

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400">
              <Mail className="h-5 w-5" />
            </div>

            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Lista de contatos
            </p>

            <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-white">
              {inscricoes.length}
            </p>
          </div>
        </div>

        {/* =================================================
            TABELA
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">

          {/* TOPO */}

          <div className="flex flex-col gap-4 border-b border-zinc-200 p-5 dark:border-zinc-800 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Lista de inscritos
              </h2>

              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Pessoas cadastradas através da newsletter.
              </p>
            </div>

            {/* BUSCA */}

            <div className="relative w-full md:w-[320px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

              <input
                type="text"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar por nome ou e-mail..."
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-indigo-500"
              />
            </div>
          </div>

          {/* =================================================
              ERRO
          ================================================= */}

          {erro && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              <strong>
                Erro ao carregar inscrições:
              </strong>{" "}

              {erro}
            </div>
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-zinc-500">
                <RefreshCw className="h-6 w-6 animate-spin" />

                <span className="text-sm">
                  Carregando inscrições...
                </span>
              </div>
            </div>
          ) : inscricoesFiltradas.length === 0 ? (

            /* ===============================================
               VAZIO
            =============================================== */

            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Mail className="h-6 w-6 text-zinc-500" />
              </div>

              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {busca
                  ? "Nenhum resultado encontrado"
                  : "Nenhuma inscrição encontrada"}
              </h3>

              <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                {busca
                  ? "Nenhum inscrito corresponde à sua busca."
                  : "Os contatos cadastrados através da newsletter aparecerão aqui."}
              </p>
            </div>
          ) : (

            /* ===============================================
               LISTAGEM
            =============================================== */

            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">

                {/* CABEÇALHO */}

                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/70 text-left dark:border-zinc-800 dark:bg-zinc-950/40">

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Nome
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      E-mail
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Data
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Hora
                    </th>
                  </tr>
                </thead>

                {/* CORPO */}

                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {inscricoesFiltradas.map(
                    (inscricao) => (
                      <tr
                        key={inscricao.id}
                        className="transition hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30"
                      >

                        {/* NOME */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">

                            {/* AVATAR */}

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 text-sm font-bold text-white">
                              {inscricao.nome
                                ?.trim()
                                .charAt(0)
                                .toUpperCase() ||
                                "?"}
                            </div>

                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {inscricao.nome}
                            </span>
                          </div>
                        </td>

                        {/* EMAIL */}

<td className="px-6 py-4">
  <a
    href={`mailto:${inscricao.email}`}
    className="inline-flex items-center gap-2 text-sm font-medium !text-zinc-700 transition hover:!text-indigo-600 dark:!text-zinc-200 dark:hover:!text-indigo-400"
  >
    <Mail className="h-4 w-4 shrink-0" />

    <span className="!text-inherit">
      {inscricao.email}
    </span>
  </a>
</td>

                        {/* DATA */}

                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {formatarData(
                            inscricao.created_at
                          )}
                        </td>

                        {/* HORA */}

                        <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                          {formatarHora(
                            inscricao.created_at
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* =================================================
              RODAPÉ DA TABELA
          ================================================= */}

          {!loading &&
            !erro &&
            inscricoesFiltradas.length > 0 && (
              <div className="border-t border-zinc-200 px-6 py-4 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Exibindo{" "}

                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {inscricoesFiltradas.length}
                </strong>{" "}

                de{" "}

                <strong className="font-semibold text-zinc-700 dark:text-zinc-200">
                  {inscricoes.length}
                </strong>{" "}

                {inscricoes.length === 1
                  ? "inscrito"
                  : "inscritos"}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}