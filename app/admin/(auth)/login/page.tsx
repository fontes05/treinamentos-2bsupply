"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertCircle,
  GraduationCap,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const erroParam = params.get("erro");

    if (erroParam === "sem-acesso") {
      setErro(
        "Este usuário não possui acesso à administração de treinamentos."
      );
    }
  }, []);

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErro("");

    const supabase = createClient();

    try {
      // =====================================================
      // 1. AUTENTICAÇÃO
      // =====================================================

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (authError) {
        console.error("Erro Supabase Auth:", {
          message: authError.message,
          status: authError.status,
          code: authError.code,
        });

        throw new Error("E-mail ou senha inválidos.");
      }

      if (!authData.user) {
        throw new Error(
          "Não foi possível autenticar o usuário."
        );
      }

      // =====================================================
      // 2. VERIFICAR SE É ADMIN DE TREINAMENTOS
      // =====================================================

      const {
        data: isAdmin,
        error: adminError,
      } = await supabase.rpc(
        "treinamentos_is_admin"
      );

      if (adminError) {
        console.error(
          "Erro verificando administrador:",
          {
            message: adminError.message,
            code: adminError.code,
            details: adminError.details,
            hint: adminError.hint,
          }
        );

        await supabase.auth.signOut();

        throw new Error(
          `Não foi possível verificar sua permissão administrativa: ${adminError.message}`
        );
      }

      // =====================================================
      // 3. USUÁRIO AUTENTICADO, MAS NÃO É ADMIN
      // =====================================================

      if (isAdmin !== true) {
        await supabase.auth.signOut();

        throw new Error(
          "Este usuário não possui acesso à administração de treinamentos."
        );
      }

      // =====================================================
      // 4. DEFINIR DESTINO
      // =====================================================

      const params = new URLSearchParams(
        window.location.search
      );

      const next = params.get("next");

      const nextValido =
        next &&
        (next === "/admin" ||
          next.startsWith("/admin/")) &&
        !next.startsWith("//") &&
        next !== "/admin/login" &&
        !next.startsWith("/admin/login?");

      const destino = nextValido
        ? next
        : "/admin";

      // =====================================================
      // 5. LOGIN CONCLUÍDO
      // =====================================================

      router.replace(destino);
      router.refresh();
    } catch (error) {
      console.error("Erro no login:", error);

      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao realizar login.";

      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f8] p-6">
      <Card className="w-full max-w-md border-zinc-200 bg-white shadow-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <GraduationCap size={27} />
          </div>

          <CardTitle className="text-2xl font-bold text-zinc-950">
            Administração
          </CardTitle>

          <CardDescription className="text-zinc-500">
            Acesse o painel de Treinamentos 2BSUPPLY
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* E-MAIL */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-zinc-700"
              >
                E-mail
              </Label>

              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="comercial@2bsupply.com.br"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* SENHA */}
            <div className="space-y-2">
              <Label
                htmlFor="senha"
                className="text-zinc-700"
              >
                Senha
              </Label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />

                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(event) =>
                    setSenha(event.target.value)
                  }
                  placeholder="Digite sua senha"
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* ERRO */}
            {erro && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm leading-relaxed text-red-700">
                  {erro}
                </p>
              </div>
            )}

            {/* BOTÃO */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Entrando...
                </>
              ) : (
                <>
                  <LockKeyhole size={17} />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400">
            Área restrita aos administradores dos
            treinamentos 2BSUPPLY.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}