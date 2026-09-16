"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CircleDollarSign,
  Download,
  Edit3,
  LoaderCircle,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

/* =========================================================
   TIPOS
========================================================= */

type TipoCusto =
  | "fixo"
  | "variavel";

type Recorrencia =
  | "unico"
  | "mensal"
  | "anual";

type Periodo =
  | 7
  | 30
  | 90;

type Custo = {
  id: string;
  descricao: string;
  categoria: string;
  tipo: TipoCusto;
  valor: number | string;
  recorrencia: Recorrencia;
  data_inicio: string;
  data_fim: string | null;
  observacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

type Receita = {
  id: string;
  descricao: string;
  valor: number | string;
  data_receita: string;
  observacao: string | null;
  created_at: string;
  updated_at: string;
};

type HotmartVenda = {
  id: string;

  transaction: string;

  product_id:
    | number
    | string
    | null;

  product_name:
    | string
    | null;

  status:
    | string
    | null;

  gross_amount:
    | number
    | string;

  hotmart_fee:
    | number
    | string;

  net_amount:
    | number
    | string;

  currency:
    | string
    | null;

  payment_method:
    | string
    | null;

  is_subscription:
    boolean;

  order_date:
    | string
    | null;

  approved_date:
    | string
    | null;

  created_at:
    string;

  updated_at:
    string;
};

type FormCusto = {
  descricao: string;
  categoria: string;
  tipo: TipoCusto;
  valor: string;
  recorrencia: Recorrencia;
  data_inicio: string;
  data_fim: string;
  observacao: string;
  ativo: boolean;
};

type FormReceita = {
  descricao: string;
  valor: string;
  data_receita: string;
  observacao: string;
};

/* =========================================================
   HELPERS
========================================================= */

function dataHoje() {
  const agora =
    new Date();

  const year =
    agora.getFullYear();

  const month =
    String(
      agora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      agora.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function stringParaData(
  value: string
) {
  return new Date(
    `${value}T12:00:00`
  );
}

function formatarMoeda(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    valor || 0
  );
}

function formatarData(
  value:
    | string
    | null
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
    }
  ).format(
    stringParaData(
      value
    )
  );
}

function formatarDataHora(
  value:
    | string
    | null
) {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
    }
  ).format(date);
}

function normalizarNumero(
  value:
    | number
    | string
    | null
    | undefined
) {
  return Number(
    value ?? 0
  );
}

function getPeriodo(
  dias: number
) {
  const fim =
    new Date();

  fim.setHours(
    23,
    59,
    59,
    999
  );

  const inicio =
    new Date(fim);

  inicio.setDate(
    inicio.getDate() -
      (dias - 1)
  );

  inicio.setHours(
    0,
    0,
    0,
    0
  );

  return {
    inicio,
    fim,
  };
}

function dentroDoPeriodo(
  data: Date,
  inicio: Date,
  fim: Date
) {
  return (
    data >= inicio &&
    data <= fim
  );
}

function statusHotmartValido(
  status:
    | string
    | null
) {
  return (
    status ===
      "APPROVED" ||
    status ===
      "COMPLETE"
  );
}

function formatarMetodoPagamento(
  value:
    | string
    | null
) {
  if (!value) {
    return "-";
  }

  const labels:
    Record<
      string,
      string
    > = {
      PIX:
        "PIX",

      BILLET:
        "Boleto",

      CREDIT_CARD_VISA:
        "Visa",

      CREDIT_CARD_MASTERCARD:
        "Mastercard",

      CREDIT_CARD_ELO:
        "Elo",

      CREDIT_CARD:
        "Cartão",
    };

  return (
    labels[value] ??
    value
      .replace(
        /_/g,
        " "
      )
  );
}

/* =========================================================
   CUSTOS NO PERÍODO
========================================================= */

function valorCustoPeriodo(
  custo: Custo,
  inicio: Date,
  fim: Date
) {
  if (!custo.ativo) {
    return 0;
  }

  const inicioCusto =
    stringParaData(
      custo.data_inicio
    );

  const fimCusto =
    custo.data_fim
      ? stringParaData(
          custo.data_fim
        )
      : null;

  /* =======================================================
     CUSTO AINDA NÃO COMEÇOU
  ======================================================= */

  if (
    inicioCusto >
    fim
  ) {
    return 0;
  }

  /* =======================================================
     CUSTO JÁ TERMINOU
  ======================================================= */

  if (
    fimCusto &&
    fimCusto <
      inicio
  ) {
    return 0;
  }

  /* =======================================================
     PERÍODO EFETIVO
  ======================================================= */

  const inicioEfetivo =
    inicioCusto >
    inicio
      ? inicioCusto
      : inicio;

  const fimEfetivo =
    fimCusto &&
    fimCusto <
      fim
      ? fimCusto
      : fim;

  const diasAtivos =
    Math.max(
      0,
      Math.floor(
        (
          fimEfetivo.getTime() -
          inicioEfetivo.getTime()
        ) /
          (
            1000 *
            60 *
            60 *
            24
          )
      ) + 1
    );

  const valor =
    normalizarNumero(
      custo.valor
    );

  /* =======================================================
     CUSTO ÚNICO
  ======================================================= */

  if (
    custo.recorrencia ===
    "unico"
  ) {
    return dentroDoPeriodo(
      inicioCusto,
      inicio,
      fim
    )
      ? valor
      : 0;
  }

  /* =======================================================
     MENSAL

     Converte para valor diário médio:
     valor mensal / 30
  ======================================================= */

  if (
    custo.recorrencia ===
    "mensal"
  ) {
    const valorDiario =
      valor / 30;

    return (
      valorDiario *
      diasAtivos
    );
  }

  /* =======================================================
     ANUAL

     Converte para valor diário:
     valor anual / 365
  ======================================================= */

  if (
    custo.recorrencia ===
    "anual"
  ) {
    const valorDiario =
      valor / 365;

    return (
      valorDiario *
      diasAtivos
    );
  }

  return 0;
}

/* =========================================================
   FORMS
========================================================= */

function custoInicial(): FormCusto {
  return {
    descricao: "",
    categoria: "",
    tipo: "fixo",
    valor: "",
    recorrencia: "unico",
    data_inicio:
      dataHoje(),
    data_fim: "",
    observacao: "",
    ativo: true,
  };
}

function receitaInicial(): FormReceita {
  return {
    descricao: "",
    valor: "",
    data_receita:
      dataHoje(),
    observacao: "",
  };
}

/* =========================================================
   COMPONENT
========================================================= */

export default function RentabilidadePage() {
  const supabase =
    useMemo(
      () =>
        createClient(),
      []
    );

  const [
    custos,
    setCustos,
  ] =
    useState<Custo[]>(
      []
    );

  const [
    receitas,
    setReceitas,
  ] =
    useState<Receita[]>(
      []
    );

  const [
    vendasHotmart,
    setVendasHotmart,
  ] =
    useState<
      HotmartVenda[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
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

  const [
    periodo,
    setPeriodo,
  ] =
    useState<Periodo>(
      30
    );

  const [
    busca,
    setBusca,
  ] =
    useState("");

  /* MODAL CUSTO */

  const [
    modalCusto,
    setModalCusto,
  ] =
    useState(false);

  const [
    editandoCustoId,
    setEditandoCustoId,
  ] =
    useState<
      string | null
    >(null);

  const [
    formCusto,
    setFormCusto,
  ] =
    useState<FormCusto>(
      custoInicial()
    );

  /* MODAL RECEITA */

  const [
    modalReceita,
    setModalReceita,
  ] =
    useState(false);

  const [
    editandoReceitaId,
    setEditandoReceitaId,
  ] =
    useState<
      string | null
    >(null);

  const [
    formReceita,
    setFormReceita,
  ] =
    useState<FormReceita>(
      receitaInicial()
    );

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setErro("");

          const {
            data: userData,
            error: userError,
          } =
            await supabase
              .auth
              .getUser();

          if (
            userError ||
            !userData.user
          ) {
            throw new Error(
              "Sua sessão expirou. Faça login novamente."
            );
          }

          const {
            data: isAdmin,
            error: adminError,
          } =
            await supabase.rpc(
              "treinamentos_is_admin"
            );

          if (
            adminError ||
            isAdmin !== true
          ) {
            throw new Error(
              "Você não possui permissão para acessar os custos e a rentabilidade."
            );
          }

          const [
            custosResponse,
            receitasResponse,
            hotmartResponse,
          ] =
            await Promise.all([
              supabase
                .from(
                  "treinamentos_custos"
                )
                .select("*")
                .order(
                  "data_inicio",
                  {
                    ascending:
                      false,
                  }
                ),

              supabase
                .from(
                  "treinamentos_receitas"
                )
                .select("*")
                .order(
                  "data_receita",
                  {
                    ascending:
                      false,
                  }
                ),

              supabase
                .from(
                  "treinamentos_hotmart_vendas"
                )
                .select(`
                  id,
                  transaction,
                  product_id,
                  product_name,
                  status,
                  gross_amount,
                  hotmart_fee,
                  net_amount,
                  currency,
                  payment_method,
                  is_subscription,
                  order_date,
                  approved_date,
                  created_at,
                  updated_at
                `)
                .order(
                  "approved_date",
                  {
                    ascending:
                      false,
                  }
                ),
            ]);

          if (
            custosResponse.error
          ) {
            throw new Error(
              custosResponse
                .error
                .message
            );
          }

          if (
            receitasResponse.error
          ) {
            throw new Error(
              receitasResponse
                .error
                .message
            );
          }

          if (
            hotmartResponse.error
          ) {
            throw new Error(
              `Hotmart: ${hotmartResponse.error.message}`
            );
          }

          setCustos(
            (
              custosResponse.data ??
              []
            ) as Custo[]
          );

          setReceitas(
            (
              receitasResponse.data ??
              []
            ) as Receita[]
          );

          setVendasHotmart(
            (
              hotmartResponse.data ??
              []
            ) as HotmartVenda[]
          );
        } catch (error) {
          console.error(
            "Erro ao carregar rentabilidade:",
            error
          );

          setErro(
            error instanceof
              Error
              ? error.message
              : "Não foi possível carregar os dados financeiros."
          );

          setCustos([]);
          setReceitas([]);
          setVendasHotmart([]);
        } finally {
          setLoading(false);
        }
      },
      [
        supabase,
      ]
    );

  useEffect(
    () => {
      void carregar();
    },
    [
      carregar,
    ]
  );

  /* =======================================================
     PERÍODO
  ======================================================= */

  const periodoDatas =
    useMemo(
      () =>
        getPeriodo(
          periodo
        ),
      [
        periodo,
      ]
    );

  /* =======================================================
     VENDAS HOTMART DO PERÍODO
  ======================================================= */

  const vendasHotmartPeriodo =
    useMemo(
      () => {
        const {
          inicio,
          fim,
        } =
          periodoDatas;

        return vendasHotmart.filter(
          (
            venda
          ) => {
            if (
              !venda.approved_date
            ) {
              return false;
            }

            if (
              !statusHotmartValido(
                venda.status
              )
            ) {
              return false;
            }

            const data =
              new Date(
                venda.approved_date
              );

            return dentroDoPeriodo(
              data,
              inicio,
              fim
            );
          }
        );
      },
      [
        vendasHotmart,
        periodoDatas,
      ]
    );

  /* =======================================================
     MÉTRICAS
  ======================================================= */

  const metricas =
    useMemo(
      () => {
        const {
          inicio,
          fim,
        } =
          periodoDatas;

        let custosFixos =
          0;

        let custosVariaveis =
          0;

        custos.forEach(
          (
            custo
          ) => {
            const valor =
              valorCustoPeriodo(
                custo,
                inicio,
                fim
              );

            if (
              custo.tipo ===
              "fixo"
            ) {
              custosFixos +=
                valor;
            } else {
              custosVariaveis +=
                valor;
            }
          }
        );

        /* RECEITAS MANUAIS */

        const receitaManual =
          receitas.reduce(
            (
              total,
              item
            ) => {
              const data =
                stringParaData(
                  item.data_receita
                );

              if (
                dentroDoPeriodo(
                  data,
                  inicio,
                  fim
                )
              ) {
                return (
                  total +
                  normalizarNumero(
                    item.valor
                  )
                );
              }

              return total;
            },
            0
          );

        /* HOTMART */

        const hotmartBruta =
          vendasHotmartPeriodo
            .reduce(
              (
                total,
                venda
              ) =>
                total +
                normalizarNumero(
                  venda.gross_amount
                ),
              0
            );

        const hotmartTaxas =
          vendasHotmartPeriodo
            .reduce(
              (
                total,
                venda
              ) =>
                total +
                normalizarNumero(
                  venda.hotmart_fee
                ),
              0
            );

        const hotmartLiquida =
          vendasHotmartPeriodo
            .reduce(
              (
                total,
                venda
              ) =>
                total +
                normalizarNumero(
                  venda.net_amount
                ),
              0
            );

        /*
         * RECEITA USADA NA RENTABILIDADE:
         *
         * Hotmart líquida
         * +
         * receitas cadastradas manualmente
         */

        const receita =
          hotmartLiquida +
          receitaManual;

        const custoTotal =
          custosFixos +
          custosVariaveis;

        const lucro =
          receita -
          custoTotal;

        const margem =
          receita > 0
            ? (
                lucro /
                receita
              ) *
              100
            : 0;

        return {
          receita,

          receitaManual,

          hotmartBruta,
          hotmartTaxas,
          hotmartLiquida,

          vendasHotmart:
            vendasHotmartPeriodo
              .length,

          custosFixos,
          custosVariaveis,

          custoTotal,
          lucro,
          margem,
        };
      },
      [
        custos,
        receitas,
        vendasHotmartPeriodo,
        periodoDatas,
      ]
    );

  /* =======================================================
     BUSCA CUSTOS
  ======================================================= */

  const custosFiltrados =
    useMemo(
      () => {
        const termo =
          busca
            .trim()
            .toLowerCase();

        if (!termo) {
          return custos;
        }

        return custos.filter(
          (
            custo
          ) =>
            custo.descricao
              .toLowerCase()
              .includes(
                termo
              ) ||
            custo.categoria
              .toLowerCase()
              .includes(
                termo
              )
        );
      },
      [
        custos,
        busca,
      ]
    );

  /* =======================================================
     CUSTO
  ======================================================= */

  function novoCusto() {
    setEditandoCustoId(
      null
    );

    setFormCusto(
      custoInicial()
    );

    setErro("");

    setModalCusto(
      true
    );
  }

  function editarCusto(
    custo: Custo
  ) {
    setEditandoCustoId(
      custo.id
    );

    setFormCusto({
      descricao:
        custo.descricao,

      categoria:
        custo.categoria,

      tipo:
        custo.tipo,

      valor:
        String(
          custo.valor
        ),

      recorrencia:
        custo.recorrencia,

      data_inicio:
        custo.data_inicio,

      data_fim:
        custo.data_fim ??
        "",

      observacao:
        custo.observacao ??
        "",

      ativo:
        custo.ativo,
    });

    setModalCusto(
      true
    );
  }

  async function salvarCusto(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      saving
    ) {
      return;
    }

    const valor =
      Number(
        formCusto.valor
          .replace(
            ",",
            "."
          )
      );

    if (
      !formCusto.descricao.trim()
    ) {
      setErro(
        "Informe a descrição do custo."
      );

      return;
    }

    if (
      !Number.isFinite(
        valor
      ) ||
      valor < 0
    ) {
      setErro(
        "Informe um valor válido."
      );

      return;
    }

    try {
      setSaving(true);
      setErro("");

      const payload = {
        descricao:
          formCusto.descricao.trim(),

        categoria:
          formCusto.categoria.trim() ||
          "Outros",

        tipo:
          formCusto.tipo,

        valor,

        recorrencia:
          formCusto.recorrencia,

        data_inicio:
          formCusto.data_inicio,

        data_fim:
          formCusto.data_fim ||
          null,

        observacao:
          formCusto.observacao.trim() ||
          null,

        ativo:
          formCusto.ativo,
      };

      if (
        editandoCustoId
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "treinamentos_custos"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editandoCustoId
            );

        if (
          error
        ) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              "treinamentos_custos"
            )
            .insert(
              payload
            );

        if (
          error
        ) {
          throw error;
        }
      }

      setModalCusto(false);

      setSucesso(
        editandoCustoId
          ? "Custo atualizado com sucesso."
          : "Custo cadastrado com sucesso."
      );

      await carregar();
    } catch (error) {
      console.error(
        error
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível salvar o custo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function excluirCusto(
    custo: Custo
  ) {
    const confirmar =
      window.confirm(
        `Excluir o custo "${custo.descricao}"?`
      );

    if (
      !confirmar
    ) {
      return;
    }

    try {
      const {
        error,
      } =
        await supabase
          .from(
            "treinamentos_custos"
          )
          .delete()
          .eq(
            "id",
            custo.id
          );

      if (
        error
      ) {
        throw error;
      }

      setSucesso(
        "Custo excluído com sucesso."
      );

      await carregar();
    } catch (error) {
      console.error(
        error
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível excluir o custo."
      );
    }
  }

  async function alterarStatusCusto(
    custo: Custo
  ) {
    try {
      const {
        error,
      } =
        await supabase
          .from(
            "treinamentos_custos"
          )
          .update({
            ativo:
              !custo.ativo,
          })
          .eq(
            "id",
            custo.id
          );

      if (
        error
      ) {
        throw error;
      }

      await carregar();
    } catch (error) {
      console.error(
        error
      );

      setErro(
        "Não foi possível alterar o status do custo."
      );
    }
  }

  /* =======================================================
     RECEITAS MANUAIS
  ======================================================= */

  function novaReceita() {
    setEditandoReceitaId(
      null
    );

    setFormReceita(
      receitaInicial()
    );

    setModalReceita(
      true
    );
  }

  function editarReceita(
    receita: Receita
  ) {
    setEditandoReceitaId(
      receita.id
    );

    setFormReceita({
      descricao:
        receita.descricao,

      valor:
        String(
          receita.valor
        ),

      data_receita:
        receita.data_receita,

      observacao:
        receita.observacao ??
        "",
    });

    setModalReceita(
      true
    );
  }

  async function salvarReceita(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const valor =
      Number(
        formReceita.valor
          .replace(
            ",",
            "."
          )
      );

    if (
      !formReceita.descricao.trim()
    ) {
      setErro(
        "Informe a descrição da receita."
      );

      return;
    }

    if (
      !Number.isFinite(
        valor
      ) ||
      valor < 0
    ) {
      setErro(
        "Informe um valor válido."
      );

      return;
    }

    try {
      setSaving(true);
      setErro("");

      const payload = {
        descricao:
          formReceita
            .descricao
            .trim(),

        valor,

        data_receita:
          formReceita
            .data_receita,

        observacao:
          formReceita
            .observacao
            .trim() ||
          null,
      };

      if (
        editandoReceitaId
      ) {
        const {
          error,
        } =
          await supabase
            .from(
              "treinamentos_receitas"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editandoReceitaId
            );

        if (
          error
        ) {
          throw error;
        }
      } else {
        const {
          error,
        } =
          await supabase
            .from(
              "treinamentos_receitas"
            )
            .insert(
              payload
            );

        if (
          error
        ) {
          throw error;
        }
      }

      setModalReceita(false);

      setSucesso(
        editandoReceitaId
          ? "Receita atualizada."
          : "Receita cadastrada."
      );

      await carregar();
    } catch (error) {
      console.error(
        error
      );

      setErro(
        error instanceof
          Error
          ? error.message
          : "Não foi possível salvar a receita."
      );
    } finally {
      setSaving(false);
    }
  }

  async function excluirReceita(
    receita: Receita
  ) {
    const confirmar =
      window.confirm(
        `Excluir a receita "${receita.descricao}"?`
      );

    if (
      !confirmar
    ) {
      return;
    }

    const {
      error,
    } =
      await supabase
        .from(
          "treinamentos_receitas"
        )
        .delete()
        .eq(
          "id",
          receita.id
        );

    if (
      error
    ) {
      setErro(
        error.message
      );

      return;
    }

    await carregar();
  }

  /* =======================================================
     CSV CUSTOS
  ======================================================= */

  function exportarCSV() {
    const linhas =
      custosFiltrados.map(
        (
          custo
        ) => [
          custo.descricao,
          custo.categoria,

          custo.tipo ===
          "fixo"
            ? "Fixo"
            : "Variável",

          normalizarNumero(
            custo.valor
          ).toFixed(
            2
          ),

          custo.recorrencia,
          custo.data_inicio,

          custo.data_fim ??
          "",

          custo.ativo
            ? "Ativo"
            : "Inativo",
        ]
      );

    const cabecalho = [
      "Descrição",
      "Categoria",
      "Tipo",
      "Valor",
      "Recorrência",
      "Data inicial",
      "Data final",
      "Status",
    ];

    gerarCSV(
      [
        cabecalho,
        ...linhas,
      ],
      `custos-2bsupply-${dataHoje()}.csv`
    );
  }

  /* =======================================================
     CSV HOTMART
  ======================================================= */

  function exportarHotmartCSV() {
    const linhas =
      vendasHotmartPeriodo
        .map(
          (
            venda
          ) => [
            venda.transaction,

            venda.product_name ??
            "",

            venda.status ??
            "",

            normalizarNumero(
              venda.gross_amount
            ).toFixed(
              2
            ),

            normalizarNumero(
              venda.hotmart_fee
            ).toFixed(
              2
            ),

            normalizarNumero(
              venda.net_amount
            ).toFixed(
              2
            ),

            venda.payment_method ??
            "",

            venda.approved_date ??
            "",
          ]
        );

    gerarCSV(
      [
        [
          "Transação",
          "Produto",
          "Status",
          "Valor bruto",
          "Taxa Hotmart",
          "Valor líquido",
          "Pagamento",
          "Aprovação",
        ],
        ...linhas,
      ],
      `vendas-hotmart-${periodo}-dias-${dataHoje()}.csv`
    );
  }

  /* =======================================================
     GRÁFICO
  ======================================================= */

  const maiorValor =
    Math.max(
      metricas.receita,
      metricas.custoTotal,
      Math.max(
        metricas.lucro,
        0
      ),
      1
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-500">
          <LoaderCircle
            size={22}
            className="animate-spin text-emerald-600"
          />

          Carregando dados financeiros...
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">

        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">
            <TrendingUp
              size={16}
            />

            Rentabilidade
          </div>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950 lg:text-3xl">
            Custos e Rentabilidade
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Vendas Hotmart, receitas adicionais, custos, lucro e margem dos treinamentos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <PeriodoButton
            ativo={
              periodo ===
              7
            }
            onClick={() =>
              setPeriodo(
                7
              )
            }
          >
            7 dias
          </PeriodoButton>

          <PeriodoButton
            ativo={
              periodo ===
              30
            }
            onClick={() =>
              setPeriodo(
                30
              )
            }
          >
            30 dias
          </PeriodoButton>

          <PeriodoButton
            ativo={
              periodo ===
              90
            }
            onClick={() =>
              setPeriodo(
                90
              )
            }
          >
            90 dias
          </PeriodoButton>

          <button
            type="button"
            onClick={() =>
              void carregar()
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
            title="Atualizar"
          >
            <RefreshCw
              size={16}
            />
          </button>

        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {sucesso}
        </div>
      )}

      {/* ===================================================
          CARDS GERAIS
      =================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">

        <MetricCard
          titulo="Receita líquida total"
          valor={
            formatarMoeda(
              metricas.receita
            )
          }
          descricao="Hotmart líquida + outras receitas"
          icon={
            <CircleDollarSign
              size={20}
            />
          }
          tipo="positivo"
        />

        <MetricCard
          titulo="Custos fixos"
          valor={
            formatarMoeda(
              metricas.custosFixos
            )
          }
          descricao="custos recorrentes"
          icon={
            <WalletCards
              size={20}
            />
          }
        />

        <MetricCard
          titulo="Custos variáveis"
          valor={
            formatarMoeda(
              metricas.custosVariaveis
            )
          }
          descricao="custos operacionais"
          icon={
            <ReceiptText
              size={20}
            />
          }
        />

        <MetricCard
          titulo="Custo total"
          valor={
            formatarMoeda(
              metricas.custoTotal
            )
          }
          descricao="fixos + variáveis"
          icon={
            <TrendingDown
              size={20}
            />
          }
        />

        <MetricCard
          titulo="Lucro estimado"
          valor={
            formatarMoeda(
              metricas.lucro
            )
          }
          descricao="receita líquida - custos"
          icon={
            metricas.lucro >=
            0 ? (
              <TrendingUp
                size={20}
              />
            ) : (
              <TrendingDown
                size={20}
              />
            )
          }
          tipo={
            metricas.lucro >=
            0
              ? "positivo"
              : "negativo"
          }
        />

        <MetricCard
          titulo="Margem"
          valor={`${metricas.margem.toFixed(
            1
          )}%`}
          descricao="lucro / receita líquida"
          icon={
            <TrendingUp
              size={20}
            />
          }
          tipo={
            metricas.margem >=
            0
              ? "positivo"
              : "negativo"
          }
        />

      </div>

      {/* ===================================================
          HOTMART
      =================================================== */}

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 px-6 py-5 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-2">

              <ShoppingCart
                size={18}
                className="text-emerald-600"
              />

              <h3 className="font-semibold text-zinc-950">
                Vendas Hotmart
              </h3>

            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Valores calculados pelas vendas aprovadas e concluídas nos últimos {periodo} dias.
            </p>
          </div>

          <button
            type="button"
            onClick={
              exportarHotmartCSV
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <Download
              size={16}
            />

            Exportar CSV
          </button>

        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">

          <MetricCard
            titulo="Vendas"
            valor={
              String(
                metricas.vendasHotmart
              )
            }
            descricao={`últimos ${periodo} dias`}
            icon={
              <ShoppingCart
                size={20}
              />
            }
          />

          <MetricCard
            titulo="Receita bruta"
            valor={
              formatarMoeda(
                metricas.hotmartBruta
              )
            }
            descricao="valor das vendas"
            icon={
              <CircleDollarSign
                size={20}
              />
            }
            tipo="positivo"
          />

          <MetricCard
            titulo="Taxas Hotmart"
            valor={
              formatarMoeda(
                metricas.hotmartTaxas
              )
            }
            descricao="descontado pela plataforma"
            icon={
              <TrendingDown
                size={20}
              />
            }
            tipo="negativo"
          />

          <MetricCard
            titulo="Receita líquida Hotmart"
            valor={
              formatarMoeda(
                metricas.hotmartLiquida
              )
            }
            descricao="bruta - taxas"
            icon={
              <TrendingUp
                size={20}
              />
            }
            tipo="positivo"
          />

        </div>

        <div className="overflow-x-auto border-t border-zinc-100">

          <table className="w-full">

            <thead className="border-b border-zinc-200 bg-zinc-50/80">

              <tr>
                <Th>
                  Data
                </Th>

                <Th>
                  Produto
                </Th>

                <Th>
                  Status
                </Th>

                <Th>
                  Bruto
                </Th>

                <Th>
                  Taxa
                </Th>

                <Th>
                  Líquido
                </Th>

                <Th>
                  Pagamento
                </Th>

                <Th>
                  Transação
                </Th>
              </tr>

            </thead>

            <tbody>

              {vendasHotmartPeriodo.length ===
              0 ? (

                <tr>
                  <td
                    colSpan={
                      8
                    }
                    className="px-6 py-14 text-center text-sm text-zinc-500"
                  >
                    Nenhuma venda Hotmart encontrada neste período.
                  </td>
                </tr>

              ) : (

                vendasHotmartPeriodo.map(
                  (
                    venda
                  ) => (

                    <tr
                      key={
                        venda.id
                      }
                      className="border-b border-zinc-100 last:border-0"
                    >

                      <Td>
                        {formatarDataHora(
                          venda.approved_date
                        )}
                      </Td>

                      <Td className="max-w-[360px] whitespace-normal">

                        <div className="font-medium text-zinc-900">
                          {venda.product_name ??
                            "Produto Hotmart"}
                        </div>

                      </Td>

                      <Td>

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            venda.status ===
                            "COMPLETE"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {venda.status ===
                          "COMPLETE"
                            ? "Concluída"
                            : venda.status ===
                                "APPROVED"
                              ? "Aprovada"
                              : venda.status ??
                                "-"}
                        </span>

                      </Td>

                      <Td>
                        {formatarMoeda(
                          normalizarNumero(
                            venda.gross_amount
                          )
                        )}
                      </Td>

                      <Td>
                        <span className="text-red-600">
                          -
                          {formatarMoeda(
                            normalizarNumero(
                              venda.hotmart_fee
                            )
                          )}
                        </span>
                      </Td>

                      <Td>
                        <strong className="text-emerald-700">
                          {formatarMoeda(
                            normalizarNumero(
                              venda.net_amount
                            )
                          )}
                        </strong>
                      </Td>

                      <Td>
                        {formatarMetodoPagamento(
                          venda.payment_method
                        )}
                      </Td>

                      <Td>
                        <span className="font-mono text-xs text-zinc-500">
                          {venda.transaction}
                        </span>
                      </Td>

                    </tr>

                  )
                )

              )}

            </tbody>
          </table>

        </div>

      </section>

      {/* ===================================================
          RECEITA X CUSTOS
      =================================================== */}

      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">

        <div className="border-b border-zinc-200 px-6 py-5">

          <h3 className="font-semibold text-zinc-950">
            Receita x Custos x Lucro
          </h3>

          <p className="mt-1 text-sm text-zinc-500">
            Receita líquida Hotmart + outras receitas cadastradas.
          </p>

        </div>

        <div className="space-y-7 p-6">

          <FinanceBar
            titulo="Receita líquida total"
            valor={
              metricas.receita
            }
            max={
              maiorValor
            }
            className="bg-emerald-500"
          />

          <FinanceBar
            titulo="Custos"
            valor={
              metricas.custoTotal
            }
            max={
              maiorValor
            }
            className="bg-red-500"
          />

          <FinanceBar
            titulo="Lucro"
            valor={
              Math.max(
                metricas.lucro,
                0
              )
            }
            max={
              maiorValor
            }
            className="bg-blue-500"
          />

          {metricas.lucro <
            0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              O período apresenta prejuízo de{" "}
              {formatarMoeda(
                Math.abs(
                  metricas.lucro
                )
              )}
              .
            </div>
          )}

        </div>

      </section>

      {/* ===================================================
          CUSTOS
      =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 px-6 py-5 lg:flex-row lg:items-center">

          <div>
            <h3 className="font-semibold text-zinc-950">
              Custos cadastrados
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Cadastre, edite e gerencie todos os custos da operação.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />

              <input
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
                placeholder="Buscar custo..."
                className="h-10 w-[220px] rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
              />

            </div>

            <button
              type="button"
              onClick={
                exportarCSV
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <Download
                size={16}
              />

              Exportar CSV
            </button>

            <button
              type="button"
              onClick={
                novoCusto
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Plus
                size={17}
              />

              Adicionar custo
            </button>

          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="border-b border-zinc-200 bg-zinc-50/80">

              <tr>
                <Th>
                  Descrição
                </Th>

                <Th>
                  Categoria
                </Th>

                <Th>
                  Tipo
                </Th>

                <Th>
                  Valor
                </Th>

                <Th>
                  Recorrência
                </Th>

                <Th>
                  Início
                </Th>

                <Th>
                  Status
                </Th>

                <Th className="text-right">
                  Ações
                </Th>
              </tr>

            </thead>

            <tbody>

              {custosFiltrados.length ===
              0 ? (

                <tr>
                  <td
                    colSpan={
                      8
                    }
                    className="px-6 py-16 text-center text-sm text-zinc-500"
                  >
                    Nenhum custo cadastrado.
                  </td>
                </tr>

              ) : (

                custosFiltrados.map(
                  (
                    custo
                  ) => (

                    <tr
                      key={
                        custo.id
                      }
                      className="border-b border-zinc-100 transition last:border-0 hover:bg-zinc-50/50"
                    >

                      <Td>
                        <div className="font-medium text-zinc-900">
                          {custo.descricao}
                        </div>

                        {custo.observacao && (
                          <div className="mt-1 max-w-[300px] truncate text-xs text-zinc-400">
                            {custo.observacao}
                          </div>
                        )}
                      </Td>

                      <Td>
                        {custo.categoria}
                      </Td>

                      <Td>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            custo.tipo ===
                            "fixo"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {custo.tipo ===
                          "fixo"
                            ? "Fixo"
                            : "Variável"}
                        </span>
                      </Td>

                      <Td>
                        <strong className="text-zinc-900">
                          {formatarMoeda(
                            normalizarNumero(
                              custo.valor
                            )
                          )}
                        </strong>
                      </Td>

                      <Td className="capitalize">
                        {custo.recorrencia ===
                        "unico"
                          ? "Único"
                          : custo.recorrencia ===
                              "mensal"
                            ? "Mensal"
                            : "Anual"}
                      </Td>

                      <Td>
                        {formatarData(
                          custo.data_inicio
                        )}
                      </Td>

                      <Td>
                        <button
                          type="button"
                          onClick={() =>
                            void alterarStatusCusto(
                              custo
                            )
                          }
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            custo.ativo
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {custo.ativo
                            ? "Ativo"
                            : "Inativo"}
                        </button>
                      </Td>

                      <Td>
                        <div className="flex justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              editarCusto(
                                custo
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                            title="Editar"
                          >
                            <Edit3
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void excluirCusto(
                                custo
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-red-50 hover:text-red-600"
                            title="Excluir"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>
                      </Td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ===================================================
          OUTRAS RECEITAS
      =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-zinc-200 px-6 py-5 sm:flex-row sm:items-center">

          <div>
            <h3 className="font-semibold text-zinc-950">
              Outras receitas
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Cadastre somente receitas que não vieram da Hotmart. Elas serão somadas à receita líquida da Hotmart.
            </p>
          </div>

          <button
            type="button"
            onClick={
              novaReceita
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <Plus
              size={17}
            />

            Adicionar receita
          </button>

        </div>

        <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-3 text-sm text-zinc-600">
          Total de outras receitas no período:{" "}
          <strong className="text-zinc-950">
            {formatarMoeda(
              metricas.receitaManual
            )}
          </strong>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="border-b border-zinc-200 bg-zinc-50/80">

              <tr>
                <Th>
                  Descrição
                </Th>

                <Th>
                  Data
                </Th>

                <Th>
                  Valor
                </Th>

                <Th className="text-right">
                  Ações
                </Th>
              </tr>

            </thead>

            <tbody>

              {receitas.length ===
              0 ? (

                <tr>
                  <td
                    colSpan={
                      4
                    }
                    className="px-6 py-12 text-center text-sm text-zinc-500"
                  >
                    Nenhuma receita adicional cadastrada.
                  </td>
                </tr>

              ) : (

                receitas.map(
                  (
                    receita
                  ) => (

                    <tr
                      key={
                        receita.id
                      }
                      className="border-b border-zinc-100 last:border-0"
                    >

                      <Td>
                        <strong className="text-zinc-900">
                          {receita.descricao}
                        </strong>
                      </Td>

                      <Td>
                        {formatarData(
                          receita.data_receita
                        )}
                      </Td>

                      <Td>
                        <strong className="text-emerald-700">
                          {formatarMoeda(
                            normalizarNumero(
                              receita.valor
                            )
                          )}
                        </strong>
                      </Td>

                      <Td>
                        <div className="flex justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              editarReceita(
                                receita
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Edit3
                              size={16}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void excluirReceita(
                                receita
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>

                        </div>
                      </Td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ===================================================
          MODAL CUSTO
      =================================================== */}

      {modalCusto && (

        <Modal
          titulo={
            editandoCustoId
              ? "Editar custo"
              : "Adicionar custo"
          }
          descricao="Informe os dados do custo operacional."
          onClose={() =>
            setModalCusto(
              false
            )
          }
        >

          <form
            onSubmit={
              salvarCusto
            }
            className="space-y-5"
          >

            <Campo
              label="Descrição"
            >
              <input
                required
                value={
                  formCusto.descricao
                }
                onChange={(
                  event
                ) =>
                  setFormCusto(
                    (
                      atual
                    ) => ({
                      ...atual,
                      descricao:
                        event.target.value,
                    })
                  )
                }
                placeholder="Ex: Hostinger VPS"
                className={
                  inputClass
                }
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">

              <Campo
                label="Categoria"
              >
                <input
                  value={
                    formCusto.categoria
                  }
                  onChange={(
                    event
                  ) =>
                    setFormCusto(
                      (
                        atual
                      ) => ({
                        ...atual,
                        categoria:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Ex: Hospedagem"
                  className={
                    inputClass
                  }
                />
              </Campo>

              <Campo
                label="Valor"
              >
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formCusto.valor
                  }
                  onChange={(
                    event
                  ) =>
                    setFormCusto(
                      (
                        atual
                      ) => ({
                        ...atual,
                        valor:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="0,00"
                  className={
                    inputClass
                  }
                />
              </Campo>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <Campo
                label="Tipo"
              >
                <select
                  value={
                    formCusto.tipo
                  }
                  onChange={(
                    event
                  ) =>
                    setFormCusto(
                      (
                        atual
                      ) => ({
                        ...atual,
                        tipo:
                          event.target
                            .value as TipoCusto,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                >
                  <option value="fixo">
                    Fixo
                  </option>

                  <option value="variavel">
                    Variável
                  </option>
                </select>
              </Campo>

              <Campo
                label="Recorrência"
              >
                <select
                  value={
                    formCusto.recorrencia
                  }
                  onChange={(
                    event
                  ) =>
                    setFormCusto(
                      (
                        atual
                      ) => ({
                        ...atual,
                        recorrencia:
                          event.target
                            .value as Recorrencia,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                >
                  <option value="unico">
                    Único
                  </option>

                  <option value="mensal">
                    Mensal
                  </option>

                  <option value="anual">
                    Anual
                  </option>
                </select>
              </Campo>

            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <Campo
                label="Data inicial"
              >
                <input
                  required
                  type="date"
                  value={
                    formCusto.data_inicio
                  }
                  onChange={(
                    event
                  ) =>
                    setFormCusto(
                      (
                        atual
                      ) => ({
                        ...atual,
                        data_inicio:
                          event.target.value,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Campo>

              <Campo
                label="Data final"
                optional
              >
                <input
                  type="date"
                  value={
                    formCusto.data_fim
                  }
                  onChange={(
                    event
                  ) =>
                    setFormCusto(
                      (
                        atual
                      ) => ({
                        ...atual,
                        data_fim:
                          event.target.value,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Campo>

            </div>

            <Campo
              label="Observação"
              optional
            >
              <textarea
                value={
                  formCusto.observacao
                }
                onChange={(
                  event
                ) =>
                  setFormCusto(
                    (
                      atual
                    ) => ({
                      ...atual,
                      observacao:
                        event.target.value,
                    })
                  )
                }
                rows={
                  3
                }
                placeholder="Observações sobre este custo..."
                className={`${inputClass} h-auto min-h-[90px] py-3`}
              />
            </Campo>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">

              <input
                type="checkbox"
                checked={
                  formCusto.ativo
                }
                onChange={(
                  event
                ) =>
                  setFormCusto(
                    (
                      atual
                    ) => ({
                      ...atual,
                      ativo:
                        event.target.checked,
                    })
                  )
                }
                className="h-4 w-4 accent-emerald-600"
              />

              <div>
                <p className="text-sm font-medium text-zinc-900">
                  Custo ativo
                </p>

                <p className="text-xs text-zinc-500">
                  Custos inativos não entram nos cálculos.
                </p>
              </div>

            </label>

            <ModalFooter
              saving={
                saving
              }
              onCancel={() =>
                setModalCusto(
                  false
                )
              }
              submitLabel={
                editandoCustoId
                  ? "Salvar alterações"
                  : "Adicionar custo"
              }
            />

          </form>

        </Modal>

      )}

      {/* ===================================================
          MODAL RECEITA
      =================================================== */}

      {modalReceita && (

        <Modal
          titulo={
            editandoReceitaId
              ? "Editar receita"
              : "Adicionar receita"
          }
          descricao="Cadastre uma receita que não veio da Hotmart."
          onClose={() =>
            setModalReceita(
              false
            )
          }
        >

          <form
            onSubmit={
              salvarReceita
            }
            className="space-y-5"
          >

            <Campo
              label="Descrição"
            >
              <input
                required
                value={
                  formReceita.descricao
                }
                onChange={(
                  event
                ) =>
                  setFormReceita(
                    (
                      atual
                    ) => ({
                      ...atual,
                      descricao:
                        event.target.value,
                    })
                  )
                }
                placeholder="Ex: Venda direta / PIX..."
                className={
                  inputClass
                }
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">

              <Campo
                label="Valor"
              >
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    formReceita.valor
                  }
                  onChange={(
                    event
                  ) =>
                    setFormReceita(
                      (
                        atual
                      ) => ({
                        ...atual,
                        valor:
                          event.target.value,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Campo>

              <Campo
                label="Data"
              >
                <input
                  required
                  type="date"
                  value={
                    formReceita.data_receita
                  }
                  onChange={(
                    event
                  ) =>
                    setFormReceita(
                      (
                        atual
                      ) => ({
                        ...atual,
                        data_receita:
                          event.target.value,
                      })
                    )
                  }
                  className={
                    inputClass
                  }
                />
              </Campo>

            </div>

            <Campo
              label="Observação"
              optional
            >
              <textarea
                rows={
                  3
                }
                value={
                  formReceita.observacao
                }
                onChange={(
                  event
                ) =>
                  setFormReceita(
                    (
                      atual
                    ) => ({
                      ...atual,
                      observacao:
                        event.target.value,
                    })
                  )
                }
                className={`${inputClass} h-auto min-h-[90px] py-3`}
              />
            </Campo>

            <ModalFooter
              saving={
                saving
              }
              onCancel={() =>
                setModalReceita(
                  false
                )
              }
              submitLabel={
                editandoReceitaId
                  ? "Salvar alterações"
                  : "Adicionar receita"
              }
            />

          </form>

        </Modal>

      )}

    </div>
  );
}

/* =========================================================
   CSV
========================================================= */

function gerarCSV(
  linhas:
    (
      | string
      | number
    )[][],
  filename: string
) {
  const csv =
    linhas
      .map(
        (
          linha
        ) =>
          linha
            .map(
              (
                valor
              ) =>
                `"${String(
                  valor
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(";")
      )
      .join("\n");

  const blob =
    new Blob(
      [
        "\uFEFF",
        csv,
      ],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href =
    url;

  link.download =
    filename;

  link.click();

  URL.revokeObjectURL(
    url
  );
}

/* =========================================================
   COMPONENTES
========================================================= */

const inputClass =
  "h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10";

function PeriodoButton({
  children,
  ativo,
  onClick,
}: {
  children:
    ReactNode;

  ativo:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`h-9 rounded-lg border px-3.5 text-sm font-medium transition ${
        ativo
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({
  titulo,
  valor,
  descricao,
  icon,
  tipo = "normal",
}: {
  titulo:
    string;

  valor:
    string;

  descricao:
    string;

  icon:
    ReactNode;

  tipo?:
    | "normal"
    | "positivo"
    | "negativo";
}) {
  const classes =
    tipo ===
    "positivo"
      ? "bg-emerald-50 text-emerald-600"
      : tipo ===
          "negativo"
        ? "bg-red-50 text-red-600"
        : "bg-zinc-100 text-zinc-600";

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {titulo}
          </p>

          <p
            className={`mt-4 text-2xl font-bold tracking-tight ${
              tipo ===
              "negativo"
                ? "text-red-600"
                : "text-zinc-950"
            }`}
          >
            {valor}
          </p>

          <p className="mt-2 text-xs text-zinc-400">
            {descricao}
          </p>
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${classes}`}>
          {icon}
        </div>

      </div>

    </article>
  );
}

function FinanceBar({
  titulo,
  valor,
  max,
  className,
}: {
  titulo:
    string;

  valor:
    number;

  max:
    number;

  className:
    string;
}) {
  const largura =
    Math.max(
      0,
      Math.min(
        100,
        (
          valor /
          max
        ) *
          100
      )
    );

  return (
    <div>

      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-800">
          {titulo}
        </span>

        <strong className="text-sm text-zinc-950">
          {formatarMoeda(
            valor
          )}
        </strong>
      </div>

      <div className="h-6 overflow-hidden rounded-full bg-zinc-100">

        <div
          className={`h-full rounded-full transition-all ${className}`}
          style={{
            width:
              `${largura}%`,
          }}
        />

      </div>

    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children:
    ReactNode;

  className?:
    string;
}) {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children:
    ReactNode;

  className?:
    string;
}) {
  return (
    <td
      className={`whitespace-nowrap px-5 py-4 text-sm text-zinc-600 ${className}`}
    >
      {children}
    </td>
  );
}

function Modal({
  titulo,
  descricao,
  children,
  onClose,
}: {
  titulo:
    string;

  descricao:
    string;

  children:
    ReactNode;

  onClose:
    () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-zinc-200 bg-white px-6 py-5">

          <div>
            <h3 className="text-lg font-bold text-zinc-950">
              {titulo}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {descricao}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X
              size={19}
            />
          </button>

        </div>

        <div className="p-6">
          {children}
        </div>

      </div>

    </div>
  );
}

function Campo({
  label,
  optional = false,
  children,
}: {
  label:
    string;

  optional?:
    boolean;

  children:
    ReactNode;
}) {
  return (
    <label className="block">

      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-700">
          {label}
        </span>

        {optional && (
          <span className="text-xs text-zinc-400">
            opcional
          </span>
        )}
      </div>

      {children}

    </label>
  );
}

function ModalFooter({
  saving,
  onCancel,
  submitLabel,
}: {
  saving:
    boolean;

  onCancel:
    () => void;

  submitLabel:
    string;
}) {
  return (
    <div className="flex justify-end gap-3 border-t border-zinc-100 pt-5">

      <button
        type="button"
        disabled={
          saving
        }
        onClick={
          onCancel
        }
        className="h-10 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
      >
        Cancelar
      </button>

      <button
        type="submit"
        disabled={
          saving
        }
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {saving && (
          <LoaderCircle
            size={16}
            className="animate-spin"
          />
        )}

        {submitLabel}
      </button>

    </div>
  );
}