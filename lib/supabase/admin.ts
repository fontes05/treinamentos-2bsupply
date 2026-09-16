import "server-only";

import {
  createClient,
} from "@supabase/supabase-js";

/* =========================================================
   VARIÁVEIS DE AMBIENTE
========================================================= */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

/* =========================================================
   VALIDAÇÕES
========================================================= */

if (!supabaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL não configurada."
  );
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY não configurada."
  );
}

/* =========================================================
   SUPABASE ADMIN

   Somente server-side.
   Nunca importar em componente "use client".
========================================================= */

export const supabaseAdmin =
  createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );