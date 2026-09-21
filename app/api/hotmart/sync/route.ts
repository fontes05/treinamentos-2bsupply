import {
  NextRequest,
  NextResponse,
} from "next/server";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  getHotmartSales,
} from "@/lib/hotmart";

import {
  getSupabaseAdmin,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   TIPOS
========================================================= */

type SummaryRow = {
  gross_amount:
    | number
    | string
    | null;

  hotmart_fee:
    | number
    | string
    | null;

  net_amount:
    | number
    | string
    | null;
};

type SummaryTotals = {
  gross: number;
  fees: number;
  net: number;
};

/*
 * Estendemos o tipo retornado por getHotmartSales
 * para garantir acesso aos dados do comprador,
 * mesmo caso buyer ainda não esteja declarado
 * explicitamente em lib/hotmart.ts.
 */
type HotmartSaleItem =
  NonNullable<
    Awaited<
      ReturnType<
        typeof getHotmartSales
      >
    >["items"]
  >[number] & {
    buyer?: {
      name?:
        | string
        | null;

      email?:
        | string
        | null;

      ucode?:
        | string
        | null;
    } | null;
  };

type ExistingClient = {
  id: string;

  buyer_ucode:
    | string
    | null;

  nome:
    | string
    | null;

  email: string;

  primeira_compra:
    | string
    | null;

  ultima_compra:
    | string
    | null;

  ultimo_produto_id:
    | string
    | null;

  ultimo_produto_nome:
    | string
    | null;

  ultima_transacao:
    | string
    | null;

  ultimo_status:
    | string
    | null;
};

type ClientCandidate = {
  buyer_ucode:
    | string
    | null;

  nome:
    | string
    | null;

  email: string;

  primeira_compra:
    | string
    | null;

  ultima_compra:
    | string
    | null;

  ultimo_produto_id:
    | string
    | null;

  ultimo_produto_nome:
    | string
    | null;

  ultima_transacao:
    | string
    | null;

  ultimo_status:
    | string
    | null;
};

type ClientSaveResult = {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
};

/* =========================================================
   CONSTANTES
========================================================= */

const HOTMART_CHUNK_DAYS =
  30;

const DAY_MS =
  24 *
  60 *
  60 *
  1000;

/* =========================================================
   TIMESTAMP HOTMART → ISO
========================================================= */

function timestampToIso(
  value?: number | null,
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}

/* =========================================================
   NORMALIZAR EMAIL
========================================================= */

function normalizeEmail(
  value?:
    | string
    | null,
) {
  const email =
    value
      ?.trim()
      .toLowerCase();

  return email || null;
}

/* =========================================================
   MENOR DATA
========================================================= */

function earliestIsoDate(
  a:
    | string
    | null,

  b:
    | string
    | null,
) {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return new Date(a)
    .getTime() <=
    new Date(b)
      .getTime()
    ? a
    : b;
}

/* =========================================================
   MAIOR DATA
========================================================= */

function latestIsoDate(
  a:
    | string
    | null,

  b:
    | string
    | null,
) {
  if (!a) {
    return b;
  }

  if (!b) {
    return a;
  }

  return new Date(a)
    .getTime() >=
    new Date(b)
      .getTime()
    ? a
    : b;
}

/* =========================================================
   SALVAR VENDAS
========================================================= */

async function salvarVendas(
  supabaseAdmin:
    SupabaseClient,

  items:
    Awaited<
      ReturnType<
        typeof getHotmartSales
      >
    >["items"],
) {
  const rows =
    (items ?? []).flatMap(
      (originalItem) => {
        const item =
          originalItem as HotmartSaleItem;

        const transaction =
          item.purchase
            ?.transaction;

        if (!transaction) {
          return [];
        }

        const gross =
          Number(
            item.purchase
              ?.price
              ?.value ??
              0,
          );

        const fee =
          Number(
            item.purchase
              ?.hotmart_fee
              ?.total ??
              0,
          );

        const net =
          gross - fee;

        const buyerEmail =
          normalizeEmail(
            item.buyer
              ?.email,
          );

        return [
          {
            transaction,

            product_id:
              item.product
                ?.id ??
              null,

            product_name:
              item.product
                ?.name
                ?.trim() ??
              null,

            status:
              item.purchase
                ?.status ??
              null,

            gross_amount:
              gross,

            hotmart_fee:
              fee,

            net_amount:
              net,

            currency:
              item.purchase
                ?.price
                ?.currency_code ??
              "BRL",

            payment_method:
              item.purchase
                ?.payment
                ?.method ??
              null,

            is_subscription:
              Boolean(
                item.purchase
                  ?.is_subscription,
              ),

            order_date:
              timestampToIso(
                item.purchase
                  ?.order_date,
              ),

            approved_date:
              timestampToIso(
                item.purchase
                  ?.approved_date,
              ),

            /* =============================================
               DADOS DO COMPRADOR
            ============================================= */

            buyer_name:
              item.buyer
                ?.name
                ?.trim() ??
              null,

            buyer_email:
              buyerEmail,

            buyer_ucode:
              item.buyer
                ?.ucode ??
              null,

            raw_payload:
              item,

            updated_at:
              new Date()
                .toISOString(),
          },
        ];
      },
    );

  if (
    rows.length === 0
  ) {
    return 0;
  }

  const {
    error,
  } =
    await supabaseAdmin
      .from(
        "treinamentos_hotmart_vendas",
      )
      .upsert(
        rows,
        {
          onConflict:
            "transaction",
        },
      );

  if (error) {
    console.error(
      "Erro no upsert Hotmart:",
      error,
    );

    throw new Error(
      `Erro ao salvar vendas: ${error.message}`,
    );
  }

  return rows.length;
}

/* =========================================================
   CRIAR CANDIDATOS DE CLIENTES
========================================================= */

function criarCandidatosClientes(
  items:
    Awaited<
      ReturnType<
        typeof getHotmartSales
      >
    >["items"],
) {
  const clientsMap =
    new Map<
      string,
      ClientCandidate
    >();

  for (
    const originalItem of
    items ?? []
  ) {
    const item =
      originalItem as HotmartSaleItem;

    const email =
      normalizeEmail(
        item.buyer?.email,
      );

    /*
     * Cliente sem email não entra na base.
     */
    if (!email) {
      continue;
    }

    const purchaseDate =
      timestampToIso(
        item.purchase
          ?.approved_date ??
          item.purchase
            ?.order_date,
      );

    const candidate:
      ClientCandidate = {
      buyer_ucode:
        item.buyer
          ?.ucode ??
        null,

      nome:
        item.buyer
          ?.name
          ?.trim() ??
        null,

      email,

      primeira_compra:
        purchaseDate,

      ultima_compra:
        purchaseDate,

      ultimo_produto_id:
        item.product?.id !=
        null
          ? String(
              item.product.id,
            )
          : null,

      ultimo_produto_nome:
        item.product
          ?.name
          ?.trim() ??
        null,

      ultima_transacao:
        item.purchase
          ?.transaction ??
        null,

      ultimo_status:
        item.purchase
          ?.status ??
        null,
    };

    const existing =
      clientsMap.get(
        email,
      );

    if (!existing) {
      clientsMap.set(
        email,
        candidate,
      );

      continue;
    }

    /*
     * Mantém a primeira compra mais antiga.
     */
    existing.primeira_compra =
      earliestIsoDate(
        existing
          .primeira_compra,

        candidate
          .primeira_compra,
      );

    /*
     * Só substituímos os dados de última compra
     * quando esta venda for mais recente.
     */
    const currentLatest =
      existing
        .ultima_compra;

    const candidateLatest =
      candidate
        .ultima_compra;

    const newestDate =
      latestIsoDate(
        currentLatest,
        candidateLatest,
      );

    const candidateIsLatest =
      candidateLatest &&
      newestDate ===
        candidateLatest;

    if (
      candidateIsLatest ||
      !currentLatest
    ) {
      existing.ultima_compra =
        candidateLatest;

      existing.ultimo_produto_id =
        candidate
          .ultimo_produto_id;

      existing.ultimo_produto_nome =
        candidate
          .ultimo_produto_nome;

      existing.ultima_transacao =
        candidate
          .ultima_transacao;

      existing.ultimo_status =
        candidate
          .ultimo_status;
    }

    /*
     * Atualiza nome/ucode quando existirem.
     */
    if (
      candidate.nome
    ) {
      existing.nome =
        candidate.nome;
    }

    if (
      candidate
        .buyer_ucode
    ) {
      existing.buyer_ucode =
        candidate
          .buyer_ucode;
    }
  }

  return Array.from(
    clientsMap.values(),
  );
}

/* =========================================================
   SALVAR / ATUALIZAR CLIENTES
========================================================= */

async function salvarClientes(
  supabaseAdmin:
    SupabaseClient,

  items:
    Awaited<
      ReturnType<
        typeof getHotmartSales
      >
    >["items"],
): Promise<ClientSaveResult> {
  const totalItems =
    items?.length ??
    0;

  const candidates =
    criarCandidatosClientes(
      items,
    );

  if (
    candidates.length ===
    0
  ) {
    return {
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped:
        totalItems,
    };
  }

  const emails =
    candidates.map(
      (client) =>
        client.email,
    );

  /* =======================================================
     CLIENTES QUE JÁ EXISTEM
  ======================================================= */

  const {
    data:
      existingData,

    error:
      existingError,
  } =
    await supabaseAdmin
      .from(
        "treinamentos_hotmart_clientes",
      )
      .select(`
        id,
        buyer_ucode,
        nome,
        email,
        primeira_compra,
        ultima_compra,
        ultimo_produto_id,
        ultimo_produto_nome,
        ultima_transacao,
        ultimo_status
      `)
      .in(
        "email_normalizado",
        emails,
      );

  if (existingError) {
    console.error(
      "Erro buscando clientes Hotmart:",
      existingError,
    );

    throw new Error(
      `Erro ao buscar clientes Hotmart: ${existingError.message}`,
    );
  }

  const existingClients =
    (
      existingData ??
      []
    ) as ExistingClient[];

  const existingMap =
    new Map<
      string,
      ExistingClient
    >();

  for (
    const client of
    existingClients
  ) {
    const email =
      normalizeEmail(
        client.email,
      );

    if (email) {
      existingMap.set(
        email,
        client,
      );
    }
  }

  /* =======================================================
     SEPARAR INSERTS E UPDATES
  ======================================================= */

  const inserts:
    ClientCandidate[] =
      [];

  const updates:
    Array<
      ClientCandidate & {
        id: string;
      }
    > = [];

  for (
    const candidate of
    candidates
  ) {
    const existing =
      existingMap.get(
        candidate.email,
      );

    /* =====================================================
       NOVO CLIENTE
    ===================================================== */

    if (!existing) {
      inserts.push(
        candidate,
      );

      continue;
    }

    /* =====================================================
       CLIENTE EXISTENTE
    ===================================================== */

    const firstPurchase =
      earliestIsoDate(
        existing
          .primeira_compra,

        candidate
          .primeira_compra,
      );

    const latestPurchase =
      latestIsoDate(
        existing
          .ultima_compra,

        candidate
          .ultima_compra,
      );

    const candidateIsLatest =
      candidate
        .ultima_compra &&
      latestPurchase ===
        candidate
          .ultima_compra;

    updates.push({
      id:
        existing.id,

      email:
        candidate.email,

      buyer_ucode:
        candidate
          .buyer_ucode ??
        existing
          .buyer_ucode,

      nome:
        candidate.nome ??
        existing.nome,

      primeira_compra:
        firstPurchase,

      ultima_compra:
        latestPurchase,

      ultimo_produto_id:
        candidateIsLatest
          ? candidate
              .ultimo_produto_id
          : existing
              .ultimo_produto_id,

      ultimo_produto_nome:
        candidateIsLatest
          ? candidate
              .ultimo_produto_nome
          : existing
              .ultimo_produto_nome,

      ultima_transacao:
        candidateIsLatest
          ? candidate
              .ultima_transacao
          : existing
              .ultima_transacao,

      ultimo_status:
        candidateIsLatest
          ? candidate
              .ultimo_status
          : existing
              .ultimo_status,
    });
  }

  /* =======================================================
     INSERT
  ======================================================= */

  if (
    inserts.length >
    0
  ) {
    const {
      error:
        insertError,
    } =
      await supabaseAdmin
        .from(
          "treinamentos_hotmart_clientes",
        )
        .insert(
          inserts,
        );

    if (insertError) {
      console.error(
        "Erro inserindo clientes Hotmart:",
        insertError,
      );

      throw new Error(
        `Erro ao inserir clientes Hotmart: ${insertError.message}`,
      );
    }
  }

  /* =======================================================
     UPDATE / UPSERT POR ID
  ======================================================= */

  if (
    updates.length >
    0
  ) {
    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "treinamentos_hotmart_clientes",
        )
        .upsert(
          updates,
          {
            onConflict:
              "id",
          },
        );

    if (updateError) {
      console.error(
        "Erro atualizando clientes Hotmart:",
        updateError,
      );

      throw new Error(
        `Erro ao atualizar clientes Hotmart: ${updateError.message}`,
      );
    }
  }

  return {
    processed:
      candidates.length,

    inserted:
      inserts.length,

    updated:
      updates.length,

    skipped:
      Math.max(
        0,
        totalItems -
          candidates.length,
      ),
  };
}

/* =========================================================
   POST /api/hotmart/sync
========================================================= */

export async function POST(
  request: NextRequest,
) {
  try {
    /* =====================================================
       SUPABASE ADMIN
    ===================================================== */

    const supabaseAdmin =
      getSupabaseAdmin();

    /* =====================================================
       BODY
    ===================================================== */

    const body =
      await request
        .json()
        .catch(
          () => ({}),
        );

    const requestedDays =
      typeof body.days ===
        "number"
        ? body.days
        : 30;

    const days =
      Math.max(
        1,
        Math.min(
          requestedDays,
          3650,
        ),
      );

    /* =====================================================
       PERÍODO TOTAL
    ===================================================== */

    const endDate =
      Date.now();

    const startDate =
      endDate -
      days *
        DAY_MS;

    /* =====================================================
       CONTADORES
    ===================================================== */

    let totalReceived =
      0;

    let totalSaved =
      0;

    let totalChunks =
      0;

    let totalPages =
      0;

    let totalClientsProcessed =
      0;

    let totalClientsInserted =
      0;

    let totalClientsUpdated =
      0;

    let totalClientsSkipped =
      0;

    /* =====================================================
       CONSULTAR EM BLOCOS
    ===================================================== */

    let chunkStart =
      startDate;

    while (
      chunkStart <=
      endDate
    ) {
      const chunkEnd =
        Math.min(
          chunkStart +
            HOTMART_CHUNK_DAYS *
              DAY_MS -
            1,

          endDate,
        );

      totalChunks++;

      console.log(
        "Hotmart sync:",
        {
          chunk:
            totalChunks,

          start:
            new Date(
              chunkStart,
            ).toISOString(),

          end:
            new Date(
              chunkEnd,
            ).toISOString(),
        },
      );

      /* ===================================================
         PAGINAÇÃO
      =================================================== */

      let pageToken:
        | string
        | undefined;

      do {
        const data =
          await getHotmartSales({
            startDate:
              chunkStart,

            endDate:
              chunkEnd,

            maxResults:
              50,

            pageToken,
          });

        totalPages++;

        const items =
          data.items ??
          [];

        totalReceived +=
          items.length;

        /* ===============================================
           SALVAR VENDAS
        =============================================== */

        const saved =
          await salvarVendas(
            supabaseAdmin,
            items,
          );

        totalSaved +=
          saved;

        /* ===============================================
           SALVAR / ATUALIZAR CLIENTES
        =============================================== */

        const clientResult =
          await salvarClientes(
            supabaseAdmin,
            items,
          );

        totalClientsProcessed +=
          clientResult.processed;

        totalClientsInserted +=
          clientResult.inserted;

        totalClientsUpdated +=
          clientResult.updated;

        totalClientsSkipped +=
          clientResult.skipped;

        pageToken =
          data.page_info
            ?.next_page_token ||
          undefined;
      } while (
        pageToken
      );

      /* ===================================================
         PRÓXIMO BLOCO
      =================================================== */

      chunkStart =
        chunkEnd + 1;
    }

    /* =====================================================
       RESUMO FINANCEIRO
    ===================================================== */

    const {
      data:
        summaryData,

      error:
        summaryError,
    } =
      await supabaseAdmin
        .from(
          "treinamentos_hotmart_vendas",
        )
        .select(`
          gross_amount,
          hotmart_fee,
          net_amount
        `)
        .gte(
          "approved_date",

          new Date(
            startDate,
          ).toISOString(),
        )
        .lte(
          "approved_date",

          new Date(
            endDate,
          ).toISOString(),
        );

    if (
      summaryError
    ) {
      throw new Error(
        `Erro ao calcular resumo: ${summaryError.message}`,
      );
    }

    const summaryRows =
      (
        summaryData ??
        []
      ) as SummaryRow[];

    const summary =
      summaryRows.reduce<
        SummaryTotals
      >(
        (
          acc,
          row,
        ) => {
          acc.gross +=
            Number(
              row.gross_amount ??
              0,
            );

          acc.fees +=
            Number(
              row.hotmart_fee ??
              0,
            );

          acc.net +=
            Number(
              row.net_amount ??
              0,
            );

          return acc;
        },

        {
          gross: 0,
          fees: 0,
          net: 0,
        },
      );

    /* =====================================================
       TOTAL DE VENDAS NO BANCO
    ===================================================== */

    const {
      count:
        databaseCount,

      error:
        countError,
    } =
      await supabaseAdmin
        .from(
          "treinamentos_hotmart_vendas",
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          },
        );

    if (
      countError
    ) {
      console.error(
        "Erro contando vendas Hotmart:",
        countError,
      );
    }

    /* =====================================================
       TOTAL DE CLIENTES NO BANCO
    ===================================================== */

    const {
      count:
        clientsDatabaseCount,

      error:
        clientsCountError,
    } =
      await supabaseAdmin
        .from(
          "treinamentos_hotmart_clientes",
        )
        .select(
          "id",
          {
            count:
              "exact",

            head:
              true,
          },
        );

    if (
      clientsCountError
    ) {
      console.error(
        "Erro contando clientes Hotmart:",
        clientsCountError,
      );
    }

    /* =====================================================
       RESPOSTA
    ===================================================== */

    return NextResponse.json({
      ok: true,

      period: {
        days,

        start:
          new Date(
            startDate,
          ).toISOString(),

        end:
          new Date(
            endDate,
          ).toISOString(),
      },

      sync: {
        chunkDays:
          HOTMART_CHUNK_DAYS,

        chunks:
          totalChunks,

        pages:
          totalPages,

        received:
          totalReceived,

        processed:
          totalSaved,

        databaseTotal:
          databaseCount ??
          null,
      },

      clients: {
        processed:
          totalClientsProcessed,

        inserted:
          totalClientsInserted,

        updated:
          totalClientsUpdated,

        skippedWithoutEmail:
          totalClientsSkipped,

        databaseTotal:
          clientsDatabaseCount ??
          null,
      },

      totals: {
        gross:
          Number(
            summary.gross
              .toFixed(
                2,
              ),
          ),

        fees:
          Number(
            summary.fees
              .toFixed(
                2,
              ),
          ),

        net:
          Number(
            summary.net
              .toFixed(
                2,
              ),
          ),
      },
    });
  } catch (
    error
  ) {
    console.error(
      "Erro sincronizando Hotmart:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
            Error
            ? error.message
            : "Erro desconhecido ao sincronizar Hotmart.",
      },

      {
        status:
          500,
      },
    );
  }
}