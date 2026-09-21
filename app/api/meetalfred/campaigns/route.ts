import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   GET /api/meetalfred/campaigns

   Exemplos:
   /api/meetalfred/campaigns
   /api/meetalfred/campaigns?type=active
   /api/meetalfred/campaigns?type=draft
   /api/meetalfred/campaigns?type=archived
   /api/meetalfred/campaigns?type=all
========================================================= */

export async function GET(
  request: NextRequest,
) {
  try {
    /* =====================================================
       API KEY
    ===================================================== */

    const apiKey =
      process.env
        .MEETALFRED_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "MEETALFRED_API_KEY não configurada.",
        },
        {
          status: 500,
        },
      );
    }

    /* =====================================================
       TYPE
    ===================================================== */

    const searchParams =
      request.nextUrl
        .searchParams;

    const requestedType =
      searchParams.get(
        "type",
      );

    const allowedTypes =
      new Set([
        "active",
        "draft",
        "archived",
        "all",
      ]);

    const type =
      requestedType &&
      allowedTypes.has(
        requestedType,
      )
        ? requestedType
        : "active";

    /* =====================================================
       URL MEET ALFRED
    ===================================================== */

    const url =
      new URL(
        "https://meetalfred.com/api/integrations/webhook/campaigns",
      );

    url.searchParams.set(
      "webhook_key",
      apiKey,
    );

    url.searchParams.set(
      "type",
      type,
    );

    /* =====================================================
       REQUEST
    ===================================================== */

    const response =
      await fetch(
        url.toString(),
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        },
      );

    /* =====================================================
       RESPOSTA
    ===================================================== */

    const rawText =
      await response.text();

    let data:
      unknown = null;

    try {
      data =
        rawText
          ? JSON.parse(
              rawText,
            )
          : null;
    } catch {
      data =
        rawText;
    }

    if (!response.ok) {
      console.error(
        "Erro Meet Alfred campaigns:",
        {
          status:
            response.status,
          data,
        },
      );

      return NextResponse.json(
        {
          ok: false,

          status:
            response.status,

          error:
            "Erro ao buscar campanhas no Meet Alfred.",

          details:
            data,
        },

        {
          status:
            response.status,
        },
      );
    }

    /* =====================================================
       SUCESSO
    ===================================================== */

    return NextResponse.json({
      ok: true,
      type,
      data,
    });
  } catch (error) {
    console.error(
      "Erro buscando campanhas Meet Alfred:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
            Error
            ? error.message
            : "Erro desconhecido ao consultar Meet Alfred.",
      },

      {
        status: 500,
      },
    );
  }
}