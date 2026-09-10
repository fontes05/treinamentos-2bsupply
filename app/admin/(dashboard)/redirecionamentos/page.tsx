"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  Copy,
  ExternalLink,
  Link2,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TIPOS
========================================================= */

type RedirectStatus =
  | 301
  | 302
  | 307
  | 308;

type RedirectRow = {
  id: number;

  origem: string;

  destino: string;

  tipo: RedirectStatus;

  ativo: boolean;

  created_at: string;

  updated_at: string;
};

/* =========================================================
   NORMALIZAR PATH
========================================================= */

function normalizarPath(
  valor: string,
  permitirQuery = false
) {
  let value =
    valor.trim();

  if (!value) {
    return "";
  }

  /* ---------------------------------------------------------
     SE FOI COLADA URL COMPLETA
  --------------------------------------------------------- */

  if (
    value.startsWith(
      "http://"
    ) ||
    value.startsWith(
      "https://"
    )
  ) {
    const url =
      new URL(value);

    const hostsPermitidos = [
      "absuprimentos.com.br",
      "www.absuprimentos.com.br",
      "localhost",
    ];

    if (
      !hostsPermitidos.includes(
        url.hostname
      )
    ) {
      throw new Error(
        "Use apenas URLs internas do absuprimentos.com.br."
      );
    }

    value =
      url.pathname;

    if (
      permitirQuery &&
      url.search
    ) {
      value +=
        url.search;
    }
  }

  /* ---------------------------------------------------------
     GARANTIR /
  --------------------------------------------------------- */

  if (
    !value.startsWith("/")
  ) {
    value =
      `/${value}`;
  }

  /* ---------------------------------------------------------
     SEPARAR PATH / QUERY
  --------------------------------------------------------- */

  const [
    pathnameOriginal,
    query,
  ] =
    value.split("?");

  let pathname =
    pathnameOriginal;

  /* ---------------------------------------------------------
     REMOVER BARRA FINAL
  --------------------------------------------------------- */

  if (
    pathname.length > 1
  ) {
    pathname =
      pathname.replace(
        /\/+$/,
        ""
      );
  }

  if (
    permitirQuery &&
    query
  ) {
    return `${pathname}?${query}`;
  }

  return pathname;
}

/* =========================================================
   FORMATAR DATA
========================================================= */

function formatarData(
  value: string
) {
  if (!value) {
    return "-";
  }

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

/* =========================================================
   PAGE
========================================================= */

export default function RedirecionamentosPage() {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  /* =======================================================
     DADOS
  ======================================================= */

  const [
    redirects,
    setRedirects,
  ] =
    useState<
      RedirectRow[]
    >([]);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    sucesso,
    setSucesso,
  ] =
    useState("");

  /* =======================================================
     PESQUISA
  ======================================================= */

  const [
    busca,
    setBusca,
  ] =
    useState("");

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  const [
    origem,
    setOrigem,
  ] =
    useState("");

  const [
    destino,
    setDestino,
  ] =
    useState("");

  const [
    tipo,
    setTipo,
  ] =
    useState<RedirectStatus>(
      301
    );

  const [
    ativo,
    setAtivo,
  ] =
    useState(true);

  const [
    editandoId,
    setEditandoId,
  ] =
    useState<
      number | null
    >(null);

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar =
    useCallback(
      async () => {
        setCarregando(
          true
        );

        setErro("");

        try {
          /* ===============================================
             USUÁRIO
          =============================================== */

          const {
            data:
              userData,
            error:
              userError,
          } =
            await supabase.auth.getUser();

          if (
            userError ||
            !userData.user
          ) {
            throw new Error(
              "Sua sessão expirou. Faça login novamente."
            );
          }

          /* ===============================================
             ADMIN
          =============================================== */

          const {
            data:
              isAdmin,
            error:
              adminError,
          } =
            await supabase.rpc(
              "treinamentos_is_admin"
            );

          if (
            adminError ||
            isAdmin !== true
          ) {
            throw new Error(
              "Você não possui permissão para gerenciar redirecionamentos."
            );
          }

          /* ===============================================
             REDIRECTS
          =============================================== */

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "treinamentos_redirects"
              )
              .select(`
                id,
                origem,
                destino,
                tipo,
                ativo,
                created_at,
                updated_at
              `)
              .order(
                "created_at",
                {
                  ascending:
                    false,
                }
              );

          if (
            error
          ) {
            throw new Error(
              error.message
            );
          }

          setRedirects(
            (data ??
              []) as RedirectRow[]
          );
        } catch (
          error
        ) {
          console.error(
            "Erro ao carregar redirects:",
            error
          );

          setErro(
            error instanceof
              Error
              ? error.message
              : "Não foi possível carregar os redirecionamentos."
          );
        } finally {
          setCarregando(
            false
          );
        }
      },
      [supabase]
    );

  /* =======================================================
     INICIAL
  ======================================================= */

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /* =======================================================
     LIMPAR FORM
  ======================================================= */

  function limparFormulario() {
    setOrigem("");
    setDestino("");

    setTipo(301);

    setAtivo(true);

    setEditandoId(
      null
    );
  }

  /* =======================================================
     EDITAR
  ======================================================= */

  function editar(
    item: RedirectRow
  ) {
    setOrigem(
      item.origem
    );

    setDestino(
      item.destino
    );

    setTipo(
      item.tipo
    );

    setAtivo(
      item.ativo
    );

    setEditandoId(
      item.id
    );

    setErro("");
    setSucesso("");

    window.scrollTo({
      top: 0,
      behavior:
        "smooth",
    });
  }

  /* =======================================================
     SALVAR
  ======================================================= */

  async function salvar(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    let origemNormalizada =
      "";

    let destinoNormalizado =
      "";

    try {
      origemNormalizada =
        normalizarPath(
          origem,
          false
        );

      destinoNormalizado =
        normalizarPath(
          destino,
          true
        );
    } catch (
      error
    ) {
      setErro(
        error instanceof Error
          ? error.message
          : "URL inválida."
      );

      return;
    }

    if (
      !origemNormalizada
    ) {
      setErro(
        "Informe a URL antiga."
      );

      return;
    }

    if (
      !destinoNormalizado
    ) {
      setErro(
        "Informe a URL nova."
      );

      return;
    }

    if (
      origemNormalizada ===
      destinoNormalizado
    ) {
      setErro(
        "A URL antiga e a URL nova não podem ser iguais."
      );

      return;
    }

    try {
      setSalvando(
        true
      );

      const payload = {
        origem:
          origemNormalizada,

        destino:
          destinoNormalizado,

        tipo,

        ativo,

        updated_at:
          new Date().toISOString(),
      };

      /* ===============================================
         EDITAR
      =============================================== */

      if (
        editandoId !==
        null
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "treinamentos_redirects"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editandoId
            );

        if (
          error
        ) {
          throw error;
        }

        setSucesso(
          "Redirecionamento atualizado com sucesso."
        );
      }

      /* ===============================================
         CRIAR
      =============================================== */

      else {
        const {
          error,
        } =
          await supabase
            .from(
              "treinamentos_redirects"
            )
            .insert({
              ...payload,

              created_at:
                new Date().toISOString(),
            });

        if (
          error
        ) {
          throw error;
        }

        setSucesso(
          "Redirecionamento criado com sucesso."
        );
      }

      limparFormulario();

      await carregar();
    } catch (
      error: any
    ) {
      console.error(
        "Erro ao salvar redirect:",
        error
      );

      if (
        error?.code ===
        "23505"
      ) {
        setErro(
          "Já existe um redirecionamento cadastrado para essa URL antiga."
        );

        return;
      }

      setErro(
        error?.message ??
          "Não foi possível salvar o redirecionamento."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  /* =======================================================
     ATIVAR / DESATIVAR
  ======================================================= */

  async function alternarStatus(
    item: RedirectRow
  ) {
    setErro("");
    setSucesso("");

    try {
      const {
        error,
      } =
        await supabase
          .from(
            "treinamentos_redirects"
          )
          .update({
            ativo:
              !item.ativo,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            item.id
          );

      if (
        error
      ) {
        throw error;
      }

      setSucesso(
        !item.ativo
          ? "Redirecionamento ativado."
          : "Redirecionamento desativado."
      );

      await carregar();
    } catch (
      error
    ) {
      console.error(
        error
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível alterar o status."
      );
    }
  }

  /* =======================================================
     EXCLUIR
  ======================================================= */

  async function excluir(
    item: RedirectRow
  ) {
    const confirmou =
      window.confirm(
        `Deseja excluir este redirecionamento?\n\n${item.origem}\n→ ${item.destino}`
      );

    if (
      !confirmou
    ) {
      return;
    }

    setErro("");
    setSucesso("");

    try {
      const {
        error,
      } =
        await supabase
          .from(
            "treinamentos_redirects"
          )
          .delete()
          .eq(
            "id",
            item.id
          );

      if (
        error
      ) {
        throw error;
      }

      if (
        editandoId ===
        item.id
      ) {
        limparFormulario();
      }

      setSucesso(
        "Redirecionamento excluído."
      );

      await carregar();
    } catch (
      error
    ) {
      console.error(
        error
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível excluir o redirecionamento."
      );
    }
  }

  /* =======================================================
     COPIAR
  ======================================================= */

  async function copiar(
    value: string
  ) {
    try {
      await navigator.clipboard.writeText(
        value
      );

      setSucesso(
        "URL copiada."
      );
    } catch {
      setErro(
        "Não foi possível copiar a URL."
      );
    }
  }

  /* =======================================================
     TESTAR
  ======================================================= */

  function testar(
    item: RedirectRow
  ) {
    window.open(
      `${window.location.origin}${item.origem}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =======================================================
     FILTRO
  ======================================================= */

  const redirectsFiltrados =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (
        !termo
      ) {
        return redirects;
      }

      return redirects.filter(
        (item) =>
          item.origem
            .toLowerCase()
            .includes(
              termo
            ) ||
          item.destino
            .toLowerCase()
            .includes(
              termo
            )
      );
    }, [
      redirects,
      busca,
    ]);

  /* =======================================================
     TOTAIS
  ======================================================= */

  const ativos =
    redirects.filter(
      (item) =>
        item.ativo
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">

        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <Link2
              size={18}
            />

            URLs
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
            Redirecionamentos
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            Redirecione URLs antigas para novos endereços
            sem perder acessos, links externos ou autoridade
            nos mecanismos de busca.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void carregar()
          }
          disabled={
            carregando
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={
              carregando
                ? "animate-spin"
                : ""
            }
          />

          Atualizar
        </button>

      </div>

      {/* =================================================
          MENSAGENS
      ================================================= */}

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2
            size={17}
          />

          {sucesso}
        </div>
      )}

      {/* =================================================
          FORM
      ================================================= */}

      <form
        onSubmit={salvar}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >

        <div className="mb-6 flex items-start justify-between gap-4">

          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              {editandoId !== null
                ? "Editar redirecionamento"
                : "Novo redirecionamento"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Você pode informar somente o caminho ou colar
              a URL completa do ABSuprimentos.
            </p>
          </div>

          {editandoId !==
            null && (
            <button
              type="button"
              onClick={
                limparFormulario
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              <X
                size={15}
              />

              Cancelar
            </button>
          )}

        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr_auto_1fr_180px_130px] xl:items-end">

          {/* URL ANTIGA */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              URL antiga
            </label>

            <input
              type="text"
              value={
                origem
              }
              onChange={(
                event
              ) =>
                setOrigem(
                  event.target.value
                )
              }
              placeholder="/cursos/ia-em-suprimentos"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />

            <p className="mt-2 text-xs text-zinc-400">
              Ex.: /cursos/ia-em-suprimentos
            </p>
          </div>

          {/* SETA */}

          <div className="hidden h-11 items-center justify-center text-zinc-300 xl:flex">
            <ArrowRight
              size={22}
            />
          </div>

          {/* URL NOVA */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              URL nova
            </label>

            <input
              type="text"
              value={
                destino
              }
              onChange={(
                event
              ) =>
                setDestino(
                  event.target.value
                )
              }
              placeholder="/cursos/curso-ia-em-suprimentos"
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />

            <p className="mt-2 text-xs text-zinc-400">
              Ex.: /cursos/curso-ia-em-suprimentos
            </p>
          </div>

          {/* TIPO */}

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Tipo
            </label>

            <select
              value={
                tipo
              }
              onChange={(
                event
              ) =>
                setTipo(
                  Number(
                    event.target.value
                  ) as RedirectStatus
                )
              }
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-emerald-500"
            >
              <option value={301}>
                301 — Permanente
              </option>

              <option value={302}>
                302 — Temporário
              </option>

              <option value={307}>
                307 — Temporário
              </option>

              <option value={308}>
                308 — Permanente
              </option>
            </select>
          </div>

          {/* STATUS */}

          <label className="flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 px-4">
            <input
              type="checkbox"
              checked={
                ativo
              }
              onChange={(
                event
              ) =>
                setAtivo(
                  event.target.checked
                )
              }
              className="h-4 w-4 accent-emerald-600"
            />

            <span className="text-sm font-medium text-zinc-700">
              Ativo
            </span>
          </label>

        </div>

        <div className="mt-6 flex justify-end">

          <button
            type="submit"
            disabled={
              salvando
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            ) : editandoId !==
              null ? (
              <Pencil
                size={16}
              />
            ) : (
              <Plus
                size={17}
              />
            )}

            {salvando
              ? "Salvando..."
              : editandoId !== null
                ? "Atualizar redirecionamento"
                : "Criar redirecionamento"}
          </button>

        </div>

      </form>

      {/* =================================================
          RESUMO
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-3">

        <ResumoCard
          label="Total"
          valor={
            redirects.length
          }
        />

        <ResumoCard
          label="Ativos"
          valor={
            ativos
          }
        />

        <ResumoCard
          label="Inativos"
          valor={
            redirects.length -
            ativos
          }
        />

      </div>

      {/* =================================================
          LISTAGEM
      ================================================= */}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-zinc-100 px-6 py-5 sm:flex-row sm:items-center">

          <div>
            <h2 className="font-bold text-zinc-900">
              URLs cadastradas
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              Redirecionamentos gerenciados pelo painel.
            </p>
          </div>

          <div className="relative w-full sm:w-[360px]">

            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />

            <input
              type="search"
              value={
                busca
              }
              onChange={(
                event
              ) =>
                setBusca(
                  event.target.value
                )
              }
              placeholder="Buscar URL..."
              className="h-10 w-full rounded-lg border border-zinc-200 pl-9 pr-4 text-sm outline-none focus:border-emerald-500"
            />

          </div>

        </div>

        {carregando ? (
          <div className="flex min-h-[280px] items-center justify-center">

            <div className="flex items-center gap-3 text-sm text-zinc-500">
              <LoaderCircle
                size={19}
                className="animate-spin"
              />

              Carregando redirecionamentos...
            </div>

          </div>
        ) : redirectsFiltrados.length ===
          0 ? (
          <div className="px-6 py-16 text-center">

            <Link2
              size={34}
              className="mx-auto text-zinc-300"
            />

            <h3 className="mt-4 font-semibold text-zinc-800">
              Nenhum redirecionamento encontrado
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Cadastre a primeira URL no formulário acima.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead>
                <tr className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">

                  <th className="px-6 py-4">
                    URL antiga
                  </th>

                  <th className="px-5 py-4">
                    URL nova
                  </th>

                  <th className="px-5 py-4 text-center">
                    Tipo
                  </th>

                  <th className="px-5 py-4 text-center">
                    Status
                  </th>

                  <th className="px-5 py-4">
                    Atualizado
                  </th>

                  <th className="px-6 py-4 text-right">
                    Ações
                  </th>

                </tr>
              </thead>

              <tbody>

                {redirectsFiltrados.map(
                  (item) => (
                    <tr
                      key={
                        item.id
                      }
                      className="border-t border-zinc-100 transition hover:bg-zinc-50/70"
                    >

                      {/* ORIGEM */}

                      <td className="px-6 py-5">

                        <div className="flex items-center gap-2">

                          <code className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                            {
                              item.origem
                            }
                          </code>

                          <button
                            type="button"
                            onClick={() =>
                              void copiar(
                                item.origem
                              )
                            }
                            className="text-zinc-400 transition hover:text-zinc-700"
                            title="Copiar"
                          >
                            <Copy
                              size={14}
                            />
                          </button>

                        </div>

                      </td>

                      {/* DESTINO */}

                      <td className="px-5 py-5">

                        <div className="flex items-center gap-2">

                          <ArrowRight
                            size={14}
                            className="text-zinc-300"
                          />

                          <code className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                            {
                              item.destino
                            }
                          </code>

                        </div>

                      </td>

                      {/* TIPO */}

                      <td className="px-5 py-5 text-center">

                        <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                          {
                            item.tipo
                          }
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-5 text-center">

                        <button
                          type="button"
                          onClick={() =>
                            void alternarStatus(
                              item
                            )
                          }
                          className={`
                            inline-flex rounded-full px-3 py-1.5
                            text-xs font-semibold transition
                            ${
                              item.ativo
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                            }
                          `}
                        >
                          {item.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </button>

                      </td>

                      {/* DATA */}

                      <td className="px-5 py-5 text-sm text-zinc-500">
                        {formatarData(
                          item.updated_at
                        )}
                      </td>

                      {/* AÇÕES */}

                      <td className="px-6 py-5">

                        <div className="flex justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              testar(
                                item
                              )
                            }
                            disabled={
                              !item.ativo
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <ExternalLink
                              size={14}
                            />

                            Testar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              editar(
                                item
                              )
                            }
                            className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                          >
                            <Pencil
                              size={14}
                            />

                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void excluir(
                                item
                              )
                            }
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-red-600 transition hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2
                              size={14}
                            />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

/* =========================================================
   RESUMO CARD
========================================================= */

function ResumoCard({
  label,
  valor,
}: {
  label: string;
  valor: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">

      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>

      <strong className="mt-2 block text-2xl font-bold text-zinc-950">
        {valor}
      </strong>

    </div>
  );
}