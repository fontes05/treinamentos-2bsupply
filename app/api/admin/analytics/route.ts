import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const propertyId =
  process.env.GA_PROPERTY_ID;

const clientEmail =
  process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;

const privateKey =
  process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

/* =========================================================
   CLIENTE GOOGLE ANALYTICS
========================================================= */

function getAnalyticsClient() {
  if (!propertyId) {
    throw new Error(
      "GA_PROPERTY_ID não configurado."
    );
  }

  if (!clientEmail) {
    throw new Error(
      "GOOGLE_ANALYTICS_CLIENT_EMAIL não configurado."
    );
  }

  if (!privateKey) {
    throw new Error(
      "GOOGLE_ANALYTICS_PRIVATE_KEY não configurado."
    );
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
}

/* =========================================================
   HELPERS
========================================================= */

function numero(
  value?: string | null
) {
  return Number(value ?? 0);
}

/* =========================================================
   NORMALIZAR ORIGEM
========================================================= */

function normalizarOrigem(
  source: string
) {
  const value =
    source
      .toLowerCase()
      .trim();

  /* DIRETO */

  if (
    value === "(direct)" ||
    value === "direct"
  ) {
    return "Direto";
  }

  /* BUSCADORES */

  if (
    value.includes("google")
  ) {
    return "Google";
  }

  if (
    value.includes("bing")
  ) {
    return "Bing";
  }

  /* INSTAGRAM */

  if (
    value.includes("instagram") ||
    value.includes("l.instagram.com")
  ) {
    return "Instagram";
  }

  /* FACEBOOK */

  if (
    value.includes("facebook") ||
    value.includes("fb.com") ||
    value.includes("m.facebook.com") ||
    value.includes("l.facebook.com")
  ) {
    return "Facebook";
  }

  /* LINKEDIN */

  if (
    value.includes("linkedin")
  ) {
    return "LinkedIn";
  }

  /* WHATSAPP */

  if (
    value.includes("whatsapp") ||
    value.includes("wa.me")
  ) {
    return "WhatsApp";
  }

  /* TIKTOK */

  if (
    value.includes("tiktok")
  ) {
    return "TikTok";
  }

  /* YOUTUBE */

  if (
    value.includes("youtube") ||
    value.includes("youtu.be")
  ) {
    return "YouTube";
  }

  /* X / TWITTER */

  if (
    value.includes("twitter") ||
    value === "t.co" ||
    value.includes("x.com")
  ) {
    return "X / Twitter";
  }

  /* SEM IDENTIFICAÇÃO */

if (
  value === "(not set)" ||
  value === ""
) {
  return "Não identificado";
}

  return source;
}

/* =========================================================
   TIPOS
========================================================= */

type Origem = {
  origem: string;
  visitantes: number;
  sessoes: number;
};

/* =========================================================
   AGRUPAR ORIGENS
========================================================= */

function agruparOrigens(
  itens: Origem[]
) {
  const mapa =
    new Map<
      string,
      Origem
    >();

  for (
    const item of itens
  ) {
    const atual =
      mapa.get(
        item.origem
      );

    if (atual) {
      atual.visitantes +=
        item.visitantes;

      atual.sessoes +=
        item.sessoes;
    } else {
      mapa.set(
        item.origem,
        {
          ...item,
        }
      );
    }
  }

  return Array.from(
    mapa.values()
  );
}

/* =========================================================
   GET
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    if (!propertyId) {
      throw new Error(
        "GA_PROPERTY_ID não configurado."
      );
    }

    const analytics =
      getAnalyticsClient();

    /* =====================================================
       DATAS
    ===================================================== */

    const inicio =
      request.nextUrl.searchParams.get(
        "inicio"
      ) || "30daysAgo";

    const fim =
      request.nextUrl.searchParams.get(
        "fim"
      ) || "today";

    const dateRanges = [
      {
        startDate:
          inicio,

        endDate:
          fim,
      },
    ];

    /* =====================================================
       CONSULTAS
    ===================================================== */

    const [
      resumoResult,
      origensResult,
      canaisResult,
      landingPagesResult,
      cursosPorOrigemResult,
    ] =
      await Promise.all([
        /* =================================================
           VISÃO GERAL
        ================================================= */

        analytics.runReport({
          property:
            `properties/${propertyId}`,

          dateRanges,

          metrics: [
            {
              name:
                "activeUsers",
            },
            {
              name:
                "sessions",
            },
            {
              name:
                "screenPageViews",
            },
          ],
        }),

        /* =================================================
           DE ONDE VIERAM
        ================================================= */

        analytics.runReport({
          property:
            `properties/${propertyId}`,

          dateRanges,

          dimensions: [
            {
              name:
                "sessionSource",
            },
          ],

          metrics: [
            {
              name:
                "activeUsers",
            },
            {
              name:
                "sessions",
            },
          ],

          orderBys: [
            {
              metric: {
                metricName:
                  "sessions",
              },

              desc:
                true,
            },
          ],

          limit:
            100,
        }),

        /* =================================================
           CANAIS

           Agora traz:
           - canal
           - origem
           - mídia
        ================================================= */

        analytics.runReport({
          property:
            `properties/${propertyId}`,

          dateRanges,

          dimensions: [
            {
              name:
                "sessionDefaultChannelGroup",
            },
            {
              name:
                "sessionSource",
            },
            {
              name:
                "sessionMedium",
            },
          ],

          metrics: [
            {
              name:
                "sessions",
            },
          ],

          orderBys: [
            {
              metric: {
                metricName:
                  "sessions",
              },

              desc:
                true,
            },
          ],

          limit:
            100,
        }),

        /* =================================================
           PÁGINAS DE ENTRADA
        ================================================= */

        analytics.runReport({
          property:
            `properties/${propertyId}`,

          dateRanges,

          dimensions: [
            {
              name:
                "landingPagePlusQueryString",
            },
          ],

          metrics: [
            {
              name:
                "sessions",
            },
          ],

          orderBys: [
            {
              metric: {
                metricName:
                  "sessions",
              },

              desc:
                true,
            },
          ],

          limit:
            20,
        }),

        /* =================================================
           CURSOS VISTOS POR ORIGEM
        ================================================= */

        analytics.runReport({
          property:
            `properties/${propertyId}`,

          dateRanges,

          dimensions: [
            {
              name:
                "sessionSource",
            },
          ],

          metrics: [
            {
              name:
                "screenPageViews",
            },
          ],

          dimensionFilter: {
            filter: {
              fieldName:
                "pagePath",

              stringFilter: {
                matchType:
                  "BEGINS_WITH",

                value:
                  "/cursos/",

                caseSensitive:
                  false,
              },
            },
          },

          limit:
            100,
        }),
      ]);

    /* =====================================================
       RESUMO
    ===================================================== */

    const resumoRow =
      resumoResult[0]
        .rows?.[0];

    const visitantes =
      numero(
        resumoRow
          ?.metricValues?.[0]
          ?.value
      );

    const sessoes =
      numero(
        resumoRow
          ?.metricValues?.[1]
          ?.value
      );

    const visualizacoes =
      numero(
        resumoRow
          ?.metricValues?.[2]
          ?.value
      );

    /* =====================================================
       ORIGENS
    ===================================================== */

    const origensBrutas:
      Origem[] =
      (
        origensResult[0]
          .rows ??
        []
      ).map(
        (row) => ({
          origem:
            normalizarOrigem(
              row
                .dimensionValues?.[0]
                ?.value ??
                "Outros"
            ),

          visitantes:
            numero(
              row
                .metricValues?.[0]
                ?.value
            ),

          sessoes:
            numero(
              row
                .metricValues?.[1]
                ?.value
            ),
        })
      );

    const origens =
      agruparOrigens(
        origensBrutas
      )
        .sort(
          (
            a,
            b
          ) =>
            b.sessoes -
            a.sessoes
        )
        .map(
          (item) => ({
            ...item,

            percentual:
              sessoes >
              0
                ? Number(
                    (
                      (item.sessoes /
                        sessoes) *
                      100
                    ).toFixed(
                      1
                    )
                  )
                : 0,
          })
        );

    /* =====================================================
       CANAIS

       Retorna também:
       origem
       mídia
       origemMidia
    ===================================================== */

    const canais =
      (
        canaisResult[0]
          .rows ??
        []
      ).map(
        (row) => {
          const canal =
            row
              .dimensionValues?.[0]
              ?.value ??
            "Outros";

          const origemOriginal =
            row
              .dimensionValues?.[1]
              ?.value ??
            "(not set)";

          const midia =
            row
              .dimensionValues?.[2]
              ?.value ??
            "(not set)";

          const origem =
            normalizarOrigem(
              origemOriginal
            );

          return {
            canal,

            origem,

            origemOriginal,

            midia,

            origemMidia:
              `${origemOriginal} / ${midia}`,

            sessoes:
              numero(
                row
                  .metricValues?.[0]
                  ?.value
              ),
          };
        }
      );

    /* =====================================================
       PÁGINAS DE ENTRADA
    ===================================================== */

    const paginasEntrada =
      (
        landingPagesResult[0]
          .rows ??
        []
      )
        .map(
          (row) => ({
            pagina:
              row
                .dimensionValues?.[0]
                ?.value ??
              "/",

            sessoes:
              numero(
                row
                  .metricValues?.[0]
                  ?.value
              ),
          })
        )
        .filter(
          (item) =>
            item.pagina !==
            "(not set)"
        );

    /* =====================================================
       CURSOS VISTOS POR ORIGEM
    ===================================================== */

    const cursosMapa =
      new Map<
        string,
        number
      >();

    for (
      const row of
        cursosPorOrigemResult[0]
          .rows ??
      []
    ) {
      const origem =
        normalizarOrigem(
          row
            .dimensionValues?.[0]
            ?.value ??
            "Outros"
        );

      const views =
        numero(
          row
            .metricValues?.[0]
            ?.value
        );

      cursosMapa.set(
        origem,
        (
          cursosMapa.get(
            origem
          ) ??
          0
        ) +
          views
      );
    }

    /* =====================================================
       DESEMPENHO POR ORIGEM
    ===================================================== */

    const desempenhoPorOrigem =
      origens.map(
        (item) => ({
          origem:
            item.origem,

          visitantes:
            item.visitantes,

          cursosVistos:
            cursosMapa.get(
              item.origem
            ) ??
            0,
        })
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      periodo: {
        inicio,
        fim,
      },

      resumo: {
        visitantes,
        sessoes,
        visualizacoes,
      },

      origens,

      canais,

      paginasEntrada,

      desempenhoPorOrigem,
    });
  } catch (
    error
  ) {
    console.error(
      "Erro Google Analytics:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
            Error
            ? error.message
            : "Erro ao carregar Google Analytics.",
      },
      {
        status:
          500,
      }
    );
  }
}