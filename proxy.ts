import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

export async function proxy(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,
      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({ name, value }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );

            supabaseResponse =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                supabaseResponse.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );

  const pathname =
    request.nextUrl.pathname;

  const isLoginPage =
    pathname === "/admin/login";

  // ========================================================
  // VERIFICAR AUTENTICAÇÃO
  // ========================================================

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  // ========================================================
  // NÃO ESTÁ AUTENTICADO
  // ========================================================

  if (claimsError || !userId) {
    // Login é público
    if (isLoginPage) {
      return supabaseResponse;
    }

    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      "/admin/login";

    loginUrl.search = "";

    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    const redirectResponse =
      NextResponse.redirect(loginUrl);

    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => {
        redirectResponse.cookies.set(
          cookie
        );
      });

    return redirectResponse;
  }

  // ========================================================
  // USUÁRIO ESTÁ LOGADO
  // VERIFICAR SE É ADMIN
  // ========================================================

  const {
    data: isAdmin,
    error: adminError,
  } = await supabase.rpc(
    "treinamentos_is_admin"
  );

  // ========================================================
  // NÃO É ADMIN
  // ========================================================

  if (
    adminError ||
    isAdmin !== true
  ) {
    // Permite abrir login
    // para trocar de conta.
    if (isLoginPage) {
      return supabaseResponse;
    }

    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      "/admin/login";

    loginUrl.search = "";

    loginUrl.searchParams.set(
      "erro",
      "sem-acesso"
    );

    const redirectResponse =
      NextResponse.redirect(
        loginUrl
      );

    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => {
        redirectResponse.cookies.set(
          cookie
        );
      });

    return redirectResponse;
  }

  // ========================================================
  // ADMIN JÁ LOGADO TENTANDO ACESSAR LOGIN
  // ========================================================

  if (isLoginPage) {
    const adminUrl =
      request.nextUrl.clone();

    adminUrl.pathname = "/admin";
    adminUrl.search = "";

    const redirectResponse =
      NextResponse.redirect(
        adminUrl
      );

    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => {
        redirectResponse.cookies.set(
          cookie
        );
      });

    return redirectResponse;
  }

  // ========================================================
  // ADMIN AUTENTICADO E AUTORIZADO
  // ========================================================

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};