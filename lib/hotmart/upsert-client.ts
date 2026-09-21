import type {
  SupabaseClient,
} from "@supabase/supabase-js";

/* =========================================================
   TIPOS
========================================================= */

export type HotmartSaleForClient = {
  buyer?: {
    name?: string | null;
    email?: string | null;
    ucode?: string | null;
  } | null;

  product?: {
    id?: string | number | null;
    name?: string | null;
  } | null;

  purchase?: {
    transaction?: string | null;
    status?: string | null;

    order_date?: number | null;
    approved_date?: number | null;
  } | null;
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeEmail(
  value?: string | null,
) {
  return value
    ?.trim()
    .toLowerCase() || null;
}

function hotmartDate(
  value?: number | null,
) {
  if (!value) {
    return null;
  }

  /*
   * A Hotmart normalmente retorna timestamps
   * em milissegundos.
   */
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
   UPSERT CLIENTE
========================================================= */

export async function upsertHotmartClientFromSale(
  supabase: SupabaseClient,
  sale: HotmartSaleForClient,
) {
  const buyer =
    sale.buyer;

  const email =
    normalizeEmail(
      buyer?.email,
    );

  /*
   * Sem email não criamos cliente.
   */
  if (!email) {
    return {
      saved: false,
      reason:
        "buyer_without_email",
    };
  }

  const purchaseDate =
    hotmartDate(
      sale.purchase
        ?.approved_date ||
        sale.purchase
          ?.order_date,
    );

  /*
   * Primeiro verificamos se o cliente já existe.
   */
  const {
    data: existing,
    error: findError,
  } = await supabase
    .from(
      "treinamentos_hotmart_clientes",
    )
    .select(
      `
        id,
        primeira_compra
      `,
    )
    .eq(
      "email_normalizado",
      email,
    )
    .maybeSingle();

  if (findError) {
    throw new Error(
      `Erro buscando cliente Hotmart: ${findError.message}`,
    );
  }

  /* =======================================================
     CLIENTE EXISTENTE
  ======================================================= */

  if (existing) {
    const {
      error,
    } = await supabase
      .from(
        "treinamentos_hotmart_clientes",
      )
      .update({
        buyer_ucode:
          buyer?.ucode ||
          null,

        nome:
          buyer?.name ||
          null,

        email,

        ultimo_produto_id:
          sale.product?.id
            ? String(
                sale.product.id,
              )
            : null,

        ultimo_produto_nome:
          sale.product
            ?.name ||
          null,

        ultima_transacao:
          sale.purchase
            ?.transaction ||
          null,

        ultimo_status:
          sale.purchase
            ?.status ||
          null,

        ultima_compra:
          purchaseDate,
      })
      .eq(
        "id",
        existing.id,
      );

    if (error) {
      throw new Error(
        `Erro atualizando cliente Hotmart: ${error.message}`,
      );
    }

    return {
      saved: true,
      action: "updated",
    };
  }

  /* =======================================================
     NOVO CLIENTE
  ======================================================= */

  const {
    error,
  } = await supabase
    .from(
      "treinamentos_hotmart_clientes",
    )
    .insert({
      buyer_ucode:
        buyer?.ucode ||
        null,

      nome:
        buyer?.name ||
        null,

      email,

      ultimo_produto_id:
        sale.product?.id
          ? String(
              sale.product.id,
            )
          : null,

      ultimo_produto_nome:
        sale.product
          ?.name ||
        null,

      ultima_transacao:
        sale.purchase
          ?.transaction ||
        null,

      ultimo_status:
        sale.purchase
          ?.status ||
        null,

      primeira_compra:
        purchaseDate,

      ultima_compra:
        purchaseDate,
    });

  if (error) {
    throw new Error(
      `Erro criando cliente Hotmart: ${error.message}`,
    );
  }

  return {
    saved: true,
    action: "inserted",
  };
}