import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.SUPABASE_USER_ID;
const newPassword = process.env.SUPABASE_NEW_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !userId || !newPassword) {
  throw new Error("Variáveis obrigatórias não informadas.");
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const { data, error } =
  await supabase.auth.admin.updateUserById(
    userId,
    {
      password: newPassword,
    }
  );

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

console.log("Senha alterada com sucesso.");
console.log("Usuário:", data.user?.email);