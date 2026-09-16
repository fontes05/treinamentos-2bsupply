import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getHotmartSales,
} from "@/lib/hotmart";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   TIPOS
========================================================= */

type SummaryRow = {
  gross_amount: number | string | null;
  hotmart_fee: number | string | null;
  net_amount: number | string | null;
};

type SummaryTotals = {
  gross: number;
  fees: number;
  net: number;
};

/* =========================================================
   CONSTANTES
========================================================= */

/*
 * A Hotmart aceitou normalmente consultas de 30 dias
 * no nosso teste.
 *
 * Para histórico grande dividimos em blocos.
 */
const HOTMART_CHUNK_DAYS = 30;

const DAY_MS =
  24 *
  60 *
  60 *
  1000;

/* =========================================================
   DATA HOTMART → ISO
========================================================= */

function timestampToIso(
  value?: number | null
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toISOString();
}

/* =========================================================
   SALVAR UM LOTE
========================================================= */

async function salvarVendas(
  items: Awaited<
    ReturnType<
      typeof getHotmartSales
    >
  >["items"]
) {
  const rows =
    (items ?? []).flatMap(
      (item) => {
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
              0
          );

        const fee =
          Number(
            item.purchase
              ?.hotmart_fee
              ?.total ??
              0
          );

        const net =
          gross - fee;

        return [
          {
            transaction,

            product_id:
              item.product?.id ??
              null,

            product_name:
              item.product?.name
                ?.trim() ??
              null,

            status:
              item.purchase?.status ??
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
                  ?.is_subscription
              ),

            order_date:
              timestampToIso(
                item.purchase
                  ?.order_date
              ),

            approved_date:
              timestampToIso(
                item.purchase
                  ?.approved_date
              ),

            raw_payload:
              item,

            updated_at:
              new Date()
                .toISOString(),
          },
        ];
      }
    );

  if (
    rows.length === 0
  ) {
    return 0;
  }

  const {
    error,
  } = await supabaseAdmin
    .from(
      "treinamentos_hotmart_vendas"
    )
    .upsert(
      rows,
      {
        onConflict:
          "transaction",
      }
    );

  if (error) {
    console.error(
      "Erro no upsert Hotmart:",
      error
    );

    throw new Error(
      `Erro ao salvar vendas: ${error.message}`
    );
  }

  return rows.length;
}

/* =========================================================
   POST /api/hotmart/sync
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    /* =====================================================
       BODY
    ===================================================== */

    const body =
      await request
        .json()
        .catch(() => ({}));

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
          3650
        )
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

    let totalReceived = 0;
    let totalSaved = 0;
    let totalChunks = 0;
    let totalPages = 0;

    /* =====================================================
       CONSULTAR EM BLOCOS DE 30 DIAS
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
          endDate
        );

      totalChunks++;

      console.log(
        "Hotmart sync:",
        {
          chunk:
            totalChunks,

          start:
            new Date(
              chunkStart
            ).toISOString(),

          end:
            new Date(
              chunkEnd
            ).toISOString(),
        }
      );

      /* ===================================================
         PAGINAÇÃO DENTRO DO BLOCO
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
          data.items ?? [];

        totalReceived +=
          items.length;

        const saved =
          await salvarVendas(
            items
          );

        totalSaved +=
          saved;

        pageToken =
          data.page_info
            ?.next_page_token ||
          undefined;
      } while (
        pageToken
      );

      /* ===================================================
         PRÓXIMO BLOCO

         +1 evita sobreposição exata.
      =================================================== */

      chunkStart =
        chunkEnd + 1;
    }

    /* =====================================================
       RESUMO DO BANCO
    ===================================================== */

    const {
      data:
        summaryData,
      error:
        summaryError,
    } = await supabaseAdmin
      .from(
        "treinamentos_hotmart_vendas"
      )
      .select(`
        gross_amount,
        hotmart_fee,
        net_amount
      `)
      .gte(
        "approved_date",
        new Date(
          startDate
        ).toISOString()
      )
      .lte(
        "approved_date",
        new Date(
          endDate
        ).toISOString()
      );

    if (
      summaryError
    ) {
      throw new Error(
        `Erro ao calcular resumo: ${summaryError.message}`
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
          row
        ) => {
          acc.gross +=
            Number(
              row.gross_amount ??
              0
            );

          acc.fees +=
            Number(
              row.hotmart_fee ??
              0
            );

          acc.net +=
            Number(
              row.net_amount ??
              0
            );

          return acc;
        },
        {
          gross: 0,
          fees: 0,
          net: 0,
        }
      );

    /* =====================================================
       TOTAL REAL DE REGISTROS
    ===================================================== */

    const {
      count:
        databaseCount,
      error:
        countError,
    } = await supabaseAdmin
      .from(
        "treinamentos_hotmart_vendas"
      )
      .select(
        "id",
        {
          count:
            "exact",

          head:
            true,
        }
      );

    if (
      countError
    ) {
      console.error(
        "Erro contando vendas Hotmart:",
        countError
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
            startDate
          ).toISOString(),

        end:
          new Date(
            endDate
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

      totals: {
        gross:
          Number(
            summary.gross.toFixed(
              2
            )
          ),

        fees:
          Number(
            summary.fees.toFixed(
              2
            )
          ),

        net:
          Number(
            summary.net.toFixed(
              2
            )
          ),
      },
    });
  } catch (error) {
    console.error(
      "Erro sincronizando Hotmart:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao sincronizar Hotmart.",
      },
      {
        status: 500,
      }
    );
  }
}