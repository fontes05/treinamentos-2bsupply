"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Download,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import type {
  HotmartCliente,
} from "./page";

/* =========================================================
   TIPOS
========================================================= */

type Props = {
  clientes: HotmartCliente[];
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(
  value:
    | string
    | null,
) {
  if (!value) {
    return "—";
  }

  return new Intl
    .DateTimeFormat(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    )
    .format(
      new Date(value),
    );
}

function statusLabel(
  status:
    | string
    | null,
) {
  switch (status) {
    case "APPROVED":
      return "Aprovada";

    case "COMPLETE":
      return "Concluída";

    case "REFUNDED":
      return "Reembolsada";

    case "CANCELLED":
      return "Cancelada";

    case "CHARGEBACK":
      return "Chargeback";

    default:
      return status || "—";
  }
}

function statusClass(
  status:
    | string
    | null,
) {
  switch (status) {
    case "APPROVED":
      return "bg-blue-50 text-blue-700";

    case "COMPLETE":
      return "bg-emerald-50 text-emerald-700";

    case "REFUNDED":
      return "bg-amber-50 text-amber-700";

    case "CANCELLED":
    case "CHARGEBACK":
      return "bg-red-50 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

/* =========================================================
   ESCAPAR CSV
========================================================= */

function escapeCsv(
  value:
    | string
    | null
    | undefined,
) {
  const text =
    value ?? "";

  return `"${String(
    text,
  ).replace(
    /"/g,
    '""',
  )}"`;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ClientesHotmartClient({
  clientes,
}: Props) {
  const router =
    useRouter();

  /* =======================================================
     BUSCA
  ======================================================= */

  const [
    search,
    setSearch,
  ] = useState("");

  /* =======================================================
     FILTRO STATUS
  ======================================================= */

  const [
    filter,
    setFilter,
  ] = useState(
    "todos",
  );

  /* =======================================================
     SELEÇÃO
  ======================================================= */

  const [
    selectedIds,
    setSelectedIds,
  ] = useState<
    Set<string>
  >(
    () =>
      new Set(),
  );

  /* =======================================================
     CLIENTES FILTRADOS
  ======================================================= */

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return clientes.filter(
        (
          cliente,
        ) => {
          const matchesSearch =
            !query ||
            cliente.nome
              ?.toLowerCase()
              .includes(
                query,
              ) ||
            cliente.email
              .toLowerCase()
              .includes(
                query,
              ) ||
            cliente
              .ultimo_produto_nome
              ?.toLowerCase()
              .includes(
                query,
              );

          if (
            !matchesSearch
          ) {
            return false;
          }

          if (
            filter ===
            "todos"
          ) {
            return true;
          }

          if (
            filter ===
            "approved"
          ) {
            return (
              cliente
                .ultimo_status ===
              "APPROVED"
            );
          }

          if (
            filter ===
            "complete"
          ) {
            return (
              cliente
                .ultimo_status ===
              "COMPLETE"
            );
          }

          if (
            filter ===
            "refunded"
          ) {
            return (
              cliente
                .ultimo_status ===
              "REFUNDED"
            );
          }

          if (
            filter ===
            "cancelled"
          ) {
            return (
              cliente
                .ultimo_status ===
                "CANCELLED" ||
              cliente
                .ultimo_status ===
                "CHARGEBACK"
            );
          }

          return true;
        },
      );
    }, [
      clientes,
      search,
      filter,
    ]);

  /* =======================================================
     SELECIONADOS
  ======================================================= */

  const selectedClientes =
    useMemo(
      () =>
        clientes.filter(
          (
            cliente,
          ) =>
            selectedIds.has(
              cliente.id,
            ),
        ),
      [
        clientes,
        selectedIds,
      ],
    );

  /* =======================================================
     TODOS VISÍVEIS SELECIONADOS
  ======================================================= */

  const allFilteredSelected =
    filtered.length >
      0 &&
    filtered.every(
      (
        cliente,
      ) =>
        selectedIds.has(
          cliente.id,
        ),
    );

  /* =======================================================
     TOGGLE CLIENTE
  ======================================================= */

  function toggleClient(
    id: string,
  ) {
    setSelectedIds(
      (
        current,
      ) => {
        const next =
          new Set(
            current,
          );

        if (
          next.has(
            id,
          )
        ) {
          next.delete(
            id,
          );
        } else {
          next.add(
            id,
          );
        }

        return next;
      },
    );
  }

  /* =======================================================
     TOGGLE TODOS FILTRADOS
  ======================================================= */

  function toggleAllFiltered() {
    setSelectedIds(
      (
        current,
      ) => {
        const next =
          new Set(
            current,
          );

        if (
          allFilteredSelected
        ) {
          for (
            const cliente of
            filtered
          ) {
            next.delete(
              cliente.id,
            );
          }
        } else {
          for (
            const cliente of
            filtered
          ) {
            next.add(
              cliente.id,
            );
          }
        }

        return next;
      },
    );
  }

  /* =======================================================
     LIMPAR SELEÇÃO
  ======================================================= */

  function clearSelection() {
    setSelectedIds(
      new Set(),
    );
  }

  /* =======================================================
     EXPORTAR CSV MEET ALFRED
  ======================================================= */

  function exportMeetAlfredCsv() {
    if (
      selectedClientes.length ===
      0
    ) {
      return;
    }

    /*
     * Evita email duplicado.
     */
    const unique =
      new Map<
        string,
        HotmartCliente
      >();

    for (
      const cliente of
      selectedClientes
    ) {
      const email =
        cliente.email
          ?.trim()
          .toLowerCase();

      if (!email) {
        continue;
      }

      if (
        !unique.has(
          email,
        )
      ) {
        unique.set(
          email,
          cliente,
        );
      }
    }

    const exportClientes =
      Array.from(
        unique.values(),
      );

    /*
     * Mantemos csv_nome porque este é o
     * campo que já foi reconhecido
     * pelo Meet Alfred no nosso teste.
     */
    const rows = [
      [
        "email",
        "csv_nome",
      ],

      ...exportClientes.map(
        (
          cliente,
        ) => [
          cliente.email
            .trim()
            .toLowerCase(),

          cliente.nome
            ?.trim() ||
            "",
        ],
      ),
    ];

    const csv =
      rows
        .map(
          (
            row,
          ) =>
            row
              .map(
                (
                  value,
                ) =>
                  escapeCsv(
                    value,
                  ),
              )
              .join(
                ",",
              ),
        )
        .join(
          "\r\n",
        );

    /*
     * BOM UTF-8:
     * ajuda Excel / Meet Alfred
     * a reconhecer acentos corretamente.
     */
    const blob =
      new Blob(
        [
          "\uFEFF",
          csv,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    const now =
      new Date();

    const date =
      [
        now
          .getFullYear(),

        String(
          now.getMonth() +
            1,
        ).padStart(
          2,
          "0",
        ),

        String(
          now.getDate(),
        ).padStart(
          2,
          "0",
        ),
      ].join(
        "-",
      );

    link.href =
      url;

    link.download =
      `clientes-hotmart-meetalfred-${date}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    URL.revokeObjectURL(
      url,
    );
  }

  /* =======================================================
     CONTADORES
  ======================================================= */

  const validEmails =
    clientes.filter(
      (
        cliente,
      ) =>
        Boolean(
          cliente.email
            ?.trim(),
        ),
    ).length;

  const activePurchases =
    clientes.filter(
      (
        cliente,
      ) =>
        cliente
          .ultimo_status ===
          "APPROVED" ||
        cliente
          .ultimo_status ===
          "COMPLETE",
    ).length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-6">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Clientes
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Base de clientes
            importados
            automaticamente da
            Hotmart.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            router.refresh()
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          <RefreshCw
            size={16}
          />

          Recarregar
        </button>
      </div>

      {/* ===================================================
          RESUMO
      =================================================== */}

      <div className="grid gap-4 md:grid-cols-3">
        {/* CLIENTES */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users
                size={20}
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Clientes
                Hotmart
              </p>

              <p className="text-2xl font-semibold text-gray-900">
                {
                  clientes.length
                }
              </p>
            </div>
          </div>
        </div>

        {/* COMPRAS ATIVAS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2
                size={20}
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Compras ativas
              </p>

              <p className="text-2xl font-semibold text-gray-900">
                {
                  activePurchases
                }
              </p>
            </div>
          </div>
        </div>

        {/* EMAILS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag
                size={20}
              />
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Disponíveis
                para exportação
              </p>

              <p className="text-2xl font-semibold text-gray-900">
                {
                  validEmails
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          EXPORTAÇÃO
      =================================================== */}

      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Download
                size={20}
                className="text-blue-600"
              />

              <h2 className="font-semibold text-gray-900">
                Exportar para
                Meet Alfred
              </h2>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              Selecione os
              clientes abaixo e
              gere um arquivo CSV
              para importar
              posteriormente na
              campanha desejada
              dentro do Meet
              Alfred.
            </p>

            <div className="mt-3 text-sm text-gray-700">
              <strong>
                {
                  selectedIds.size
                }
              </strong>{" "}
              cliente(s)
              selecionado(s)
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {selectedIds.size >
              0 && (
              <button
                type="button"
                onClick={
                  clearSelection
                }
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Limpar seleção
              </button>
            )}

            <button
              type="button"
              onClick={
                exportMeetAlfredCsv
              }
              disabled={
                selectedIds.size ===
                0
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download
                size={17}
              />

              Exportar CSV para
              Meet Alfred
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          LISTAGEM
      =================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white">
        {/* FILTROS */}

        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-lg">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={
                search
              }
              onChange={(
                event,
              ) =>
                setSearch(
                  event
                    .target
                    .value,
                )
              }
              placeholder="Buscar por nome, email ou produto..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {filtered.length >
              0 && (
              <button
                type="button"
                onClick={
                  toggleAllFiltered
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                {allFilteredSelected
                  ? "Desmarcar todos"
                  : "Selecionar todos"}
              </button>
            )}

            <select
              value={
                filter
              }
              onChange={(
                event,
              ) =>
                setFilter(
                  event
                    .target
                    .value,
                )
              }
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none"
            >
              <option value="todos">
                Todos os
                status
              </option>

              <option value="approved">
                Aprovadas
              </option>

              <option value="complete">
                Concluídas
              </option>

              <option value="refunded">
                Reembolsadas
              </option>

              <option value="cancelled">
                Canceladas /
                Chargeback
              </option>
            </select>
          </div>
        </div>

        {/* =================================================
            TABELA
        ================================================= */}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-5 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      allFilteredSelected
                    }
                    onChange={
                      toggleAllFiltered
                    }
                    disabled={
                      filtered.length ===
                      0
                    }
                    aria-label="Selecionar todos"
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cliente
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Produto
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Primeira
                  compra
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Última
                  compra
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(
                (
                  cliente,
                ) => {
                  const isSelected =
                    selectedIds.has(
                      cliente.id,
                    );

                  return (
                    <tr
                      key={
                        cliente.id
                      }
                      className={`transition ${
                        isSelected
                          ? "bg-blue-50/40"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {/* CHECKBOX */}

                      <td className="px-5 py-4 align-top">
                        <input
                          type="checkbox"
                          checked={
                            isSelected
                          }
                          onChange={() =>
                            toggleClient(
                              cliente.id,
                            )
                          }
                          aria-label={`Selecionar ${
                            cliente.nome ||
                            cliente.email
                          }`}
                          className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* CLIENTE */}

                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {cliente.nome ||
                            "Sem nome"}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          {
                            cliente.email
                          }
                        </div>
                      </td>

                      {/* PRODUTO */}

                      <td className="px-5 py-4 text-sm text-gray-700">
                        {cliente
                          .ultimo_produto_nome ||
                          "—"}
                      </td>

                      {/* PRIMEIRA COMPRA */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(
                          cliente
                            .primeira_compra,
                        )}
                      </td>

                      {/* ÚLTIMA COMPRA */}

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(
                          cliente
                            .ultima_compra,
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(
                            cliente
                              .ultimo_status,
                          )}`}
                        >
                          {statusLabel(
                            cliente
                              .ultimo_status,
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                },
              )}

              {filtered.length ===
                0 && (
                <tr>
                  <td
                    colSpan={
                      6
                    }
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Nenhum
                    cliente
                    encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-3 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            Mostrando{" "}
            <strong>
              {
                filtered.length
              }
            </strong>{" "}
            de{" "}
            <strong>
              {
                clientes.length
              }
            </strong>{" "}
            clientes.
          </div>

          {selectedIds.size >
            0 && (
            <div className="font-medium text-blue-600">
              {
                selectedIds.size
              }{" "}
              selecionado(s)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}