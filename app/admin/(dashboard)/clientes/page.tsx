import {
  createClient,
} from "@supabase/supabase-js";

import ClientesHotmartClient from "./ClientesHotmartClient";

export const dynamic =
  "force-dynamic";

/* =========================================================
   TIPOS
========================================================= */

export type HotmartCliente = {
  id: string;

  buyer_ucode:
    | string
    | null;

  nome:
    | string
    | null;

  email: string;

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

  primeira_compra:
    | string
    | null;

  ultima_compra:
    | string
    | null;

  marketing_status: string;

  created_at: string;
};

/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabaseAdmin() {
  const url =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !url ||
    !serviceKey
  ) {
    throw new Error(
      "Supabase não configurado.",
    );
  }

  return createClient(
    url,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function AdminClientesPage() {
  const supabase =
    getSupabaseAdmin();

  const {
    data,
    error,
  } =
    await supabase
      .from(
        "treinamentos_hotmart_clientes",
      )
      .select(`
        id,
        buyer_ucode,
        nome,
        email,
        ultimo_produto_id,
        ultimo_produto_nome,
        ultima_transacao,
        ultimo_status,
        primeira_compra,
        ultima_compra,
        marketing_status,
        created_at
      `)
      .order(
        "ultima_compra",
        {
          ascending: false,
          nullsFirst: false,
        },
      );

  if (error) {
    throw new Error(
      `Erro carregando clientes Hotmart: ${error.message}`,
    );
  }

  const clientes =
    (data ??
      []) as HotmartCliente[];

  return (
    <ClientesHotmartClient
      clientes={clientes}
    />
  );
}