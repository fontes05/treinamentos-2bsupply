import {
  NextResponse,
} from "next/server";

import {
  getHotmartSales,
} from "@/lib/hotmart";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    /* =====================================================
       ÚLTIMOS 30 DIAS
    ===================================================== */

    const endDate =
      Date.now();

    const startDate =
      endDate -
      30 *
      24 *
      60 *
      60 *
      1000;

    const data =
      await getHotmartSales({
        startDate,
        endDate,
        maxResults: 50,
      });

    /* =====================================================
       RETORNO SIMPLIFICADO

       Evitamos devolver todo o objeto no primeiro teste.
    ===================================================== */

    const sales =
      (data.items ?? [])
        .map(
          (item) => ({
            product:
              item.product?.name ??
              null,

            productId:
              item.product?.id ??
              null,

            transaction:
              item.purchase
                ?.transaction ??
              null,

            status:
              item.purchase?.status ??
              null,

            value:
              item.purchase?.price
                ?.value ??
              null,

            currency:
              item.purchase?.price
                ?.currency_code ??
              null,

            hotmartFee:
              item.purchase
                ?.hotmart_fee
                ?.total ??
              null,

            paymentMethod:
              item.purchase
                ?.payment
                ?.method ??
              null,

            orderDate:
              item.purchase
                ?.order_date ??
              null,

            approvedDate:
              item.purchase
                ?.approved_date ??
              null,

            isSubscription:
              item.purchase
                ?.is_subscription ??
              false,
          })
        );

    return NextResponse.json({
      ok: true,

      period: {
        start:
          new Date(
            startDate
          ).toISOString(),

        end:
          new Date(
            endDate
          ).toISOString(),
      },

      total:
        data.page_info
          ?.total_results ??
        sales.length,

      returned:
        sales.length,

      hasNextPage:
        Boolean(
          data.page_info
            ?.next_page_token
        ),

      nextPageToken:
        data.page_info
          ?.next_page_token ??
        null,

      sales,
    });
  } catch (error) {
    console.error(
      "Erro buscando vendas Hotmart:",
      error
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof Error
            ? error.message
            : "Erro ao buscar vendas da Hotmart.",
      },
      {
        status: 500,
      }
    );
  }
}