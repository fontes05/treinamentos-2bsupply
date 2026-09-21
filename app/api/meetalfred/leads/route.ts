import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  getSupabaseAdmin,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================================================
   TIPOS
========================================================= */

type ClientRow = {
  id: string;

  nome:
    | string
    | null;

  email: string;

  meetalfred_status:
    | string
    | null;

  meetalfred_campaign_id:
    | string
    | null;
};

type RequestBody = {
  clientIds?: string[];

  campaignId?:
    | number
    | string;

  campaignName?:
    | string
    | null;
};

/* =========================================================
   HELPERS
========================================================= */

function extractErrorMessage(
  data: unknown,
) {
  if (
    typeof data ===
    "string"
  ) {
    return data;
  }

  if (
    data &&
    typeof data ===
      "object"
  ) {
    const record =
      data as Record<
        string,
        unknown
      >;

    const candidates = [
      record.message,
      record.error,
      record.detail,
      record.details,
    ];

    for (
      const candidate of
      candidates
    ) {
      if (
        typeof candidate ===
          "string" &&
        candidate.trim()
      ) {
        return candidate;
      }
    }

    try {
      return JSON.stringify(
        data,
      );
    } catch {
      return (
        "Erro desconhecido retornado pelo Meet Alfred."
      );
    }
  }

  return (
    "Erro desconhecido retornado pelo Meet Alfred."
  );
}

function extractLeadId(
  data: unknown,
) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return null;
  }

  const record =
    data as Record<
      string,
      unknown
    >;

  const direct =
    record.id ??
    record.lead_id ??
    record.leadId;

  if (
    typeof direct ===
      "string" ||
    typeof direct ===
      "number"
  ) {
    return String(
      direct,
    );
  }

  const nested =
    record.data;

  if (
    nested &&
    typeof nested ===
      "object"
  ) {
    const nestedRecord =
      nested as Record<
        string,
        unknown
      >;

    const nestedId =
      nestedRecord.id ??
      nestedRecord.lead_id ??
      nestedRecord.leadId;

    if (
      typeof nestedId ===
        "string" ||
      typeof nestedId ===
        "number"
    ) {
      return String(
        nestedId,
      );
    }
  }

  return null;
}

/* =========================================================
   POST /api/meetalfred/leads
========================================================= */

export async function POST(
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
       BODY
    ===================================================== */

    const body =
      (await request
        .json()
        .catch(
          () => ({}),
        )) as RequestBody;

    const clientIds =
      Array.isArray(
        body.clientIds,
      )
        ? body.clientIds.filter(
            (
              id,
            ): id is string =>
              typeof id ===
                "string" &&
              Boolean(
                id.trim(),
              ),
          )
        : [];

    const campaignId =
      Number(
        body.campaignId,
      );

    const campaignName =
      typeof body.campaignName ===
        "string"
        ? body.campaignName
            .trim()
        : null;

    /* =====================================================
       VALIDAÇÕES
    ===================================================== */

    if (
      clientIds.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Selecione pelo menos um cliente.",
        },

        {
          status: 400,
        },
      );
    }

    if (
      clientIds.length >
      100
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Envie no máximo 100 clientes por vez.",
        },

        {
          status: 400,
        },
      );
    }

    if (
      !Number.isInteger(
        campaignId,
      ) ||
      campaignId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Campanha inválida.",
        },

        {
          status: 400,
        },
      );
    }

    /* =====================================================
       CLIENTES
    ===================================================== */

    const supabaseAdmin =
      getSupabaseAdmin();

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "treinamentos_hotmart_clientes",
        )
        .select(`
          id,
          nome,
          email,
          meetalfred_status,
          meetalfred_campaign_id
        `)
        .in(
          "id",
          clientIds,
        );

    if (error) {
      throw new Error(
        `Erro buscando clientes: ${error.message}`,
      );
    }

    const clients =
      (
        data ??
        []
      ) as ClientRow[];

    if (
      clients.length ===
      0
    ) {
      return NextResponse.json(
        {
          ok: false,

          error:
            "Nenhum cliente encontrado.",
        },

        {
          status: 404,
        },
      );
    }

    /* =====================================================
       RESULTADOS
    ===================================================== */

    const results:
      Array<{
        clientId: string;
        nome:
          | string
          | null;
        email: string;
        ok: boolean;
        skipped?: boolean;
        error?:
          | string
          | null;
      }> = [];

    /* =====================================================
       ENVIO
    ===================================================== */

    for (
      const client of
      clients
    ) {
      const email =
        client.email
          ?.trim()
          .toLowerCase();

      if (!email) {
        results.push({
          clientId:
            client.id,

          nome:
            client.nome,

          email:
            client.email,

          ok: false,

          error:
            "Cliente sem email.",
        });

        continue;
      }

      /*
       * Evita enviar novamente para a mesma campanha.
       */
      if (
        client
          .meetalfred_status ===
          "enviado" &&
        client
          .meetalfred_campaign_id ===
          String(
            campaignId,
          )
      ) {
        results.push({
          clientId:
            client.id,

          nome:
            client.nome,

          email,

          ok: true,

          skipped: true,
        });

        continue;
      }

      const now =
        new Date()
          .toISOString();

      /* ===================================================
         URL
      =================================================== */

      const url =
        new URL(
          "https://meetalfred.com/api/integrations/webhook/add_lead_to_campaign",
        );

      url.searchParams.set(
        "webhook_key",
        apiKey,
      );

      /* ===================================================
         PAYLOAD

         Primeiro teste:
         campanha + email.

         Não inventamos linkedin_profile_url.
      =================================================== */

const payload: Record<
  string,
  string | number
> = {
  campaign:
    campaignId,

  email,
};

/*
 * Campanhas de email criadas por CSV no Meet Alfred
 * podem exigir campos personalizados.
 *
 * Nesta campanha o campo suportado é:
 * csv_nome
 */
if (
  client.nome
    ?.trim()
) {
  payload.csv_nome =
    client.nome.trim();
}

      /* ===================================================
         REQUEST
      =================================================== */

      let response:
        Response;

      let responseData:
        unknown = null;

      try {
        response =
          await fetch(
            url.toString(),
            {
              method:
                "POST",

              headers: {
                Accept:
                  "application/json",

                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload,
                ),

              cache:
                "no-store",
            },
          );

        const rawText =
          await response
            .text();

        if (rawText) {
          try {
            responseData =
              JSON.parse(
                rawText,
              );
          } catch {
            responseData =
              rawText;
          }
        }
      } catch (
        fetchError
      ) {
        const message =
          fetchError instanceof
            Error
            ? fetchError
                .message
            : "Erro de conexão com Meet Alfred.";

        await supabaseAdmin
          .from(
            "treinamentos_hotmart_clientes",
          )
          .update({
            meetalfred_status:
              "erro",

            meetalfred_error:
              message,

            meetalfred_last_attempt_at:
              now,
          })
          .eq(
            "id",
            client.id,
          );

        results.push({
          clientId:
            client.id,

          nome:
            client.nome,

          email,

          ok: false,

          error:
            message,
        });

        continue;
      }

      /* ===================================================
         ERRO MEET ALFRED
      =================================================== */

      if (
        !response.ok
      ) {
        const message =
          extractErrorMessage(
            responseData,
          );

        console.error(
          "Meet Alfred:",
          {
            clientId:
              client.id,

            email,

            campaignId,

            status:
              response.status,

            response:
              responseData,
          },
        );

        const {
          error:
            updateError,
        } =
          await supabaseAdmin
            .from(
              "treinamentos_hotmart_clientes",
            )
            .update({
              meetalfred_status:
                "erro",

              meetalfred_campaign_id:
                String(
                  campaignId,
                ),

              meetalfred_campaign_name:
                campaignName,

              meetalfred_error:
                message,

              meetalfred_last_attempt_at:
                now,
            })
            .eq(
              "id",
              client.id,
            );

        if (
          updateError
        ) {
          console.error(
            "Erro salvando falha Meet Alfred:",
            updateError,
          );
        }

        results.push({
          clientId:
            client.id,

          nome:
            client.nome,

          email,

          ok: false,

          error:
            message,
        });

        continue;
      }

      /* ===================================================
         SUCESSO
      =================================================== */

      const leadId =
        extractLeadId(
          responseData,
        );

      const {
        error:
          updateError,
      } =
        await supabaseAdmin
          .from(
            "treinamentos_hotmart_clientes",
          )
          .update({
            meetalfred_status:
              "enviado",

            meetalfred_campaign_id:
              String(
                campaignId,
              ),

            meetalfred_campaign_name:
              campaignName,

            meetalfred_lead_id:
              leadId,

            meetalfred_error:
              null,

            meetalfred_enviado_em:
              now,

            meetalfred_last_attempt_at:
              now,
          })
          .eq(
            "id",
            client.id,
          );

      if (
        updateError
      ) {
        throw new Error(
          `Lead enviado ao Meet Alfred, mas houve erro ao atualizar o banco: ${updateError.message}`,
        );
      }

      results.push({
        clientId:
          client.id,

        nome:
          client.nome,

        email,

        ok: true,

        error:
          null,
      });
    }

    /* =====================================================
       RESUMO
    ===================================================== */

    const sent =
      results.filter(
        (result) =>
          result.ok &&
          !result.skipped,
      ).length;

    const skipped =
      results.filter(
        (result) =>
          result.skipped,
      ).length;

    const failed =
      results.filter(
        (result) =>
          !result.ok,
      ).length;

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      ok:
        failed === 0,

      campaign: {
        id:
          campaignId,

        name:
          campaignName,
      },

      summary: {
        total:
          results.length,

        sent,

        skipped,

        failed,
      },

      results,
    });
  } catch (
    error
  ) {
    console.error(
      "Erro enviando clientes ao Meet Alfred:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,

        error:
          error instanceof
            Error
            ? error.message
            : "Erro desconhecido.",
      },

      {
        status: 500,
      },
    );
  }
}