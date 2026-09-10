import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

/* =========================================================
   TIPOS
========================================================= */

type RedirectStatus =
  | 301
  | 302
  | 307
  | 308;

type RedirectRow = {
  destino: string;
  tipo: number;
};

/* =========================================================
   NORMALIZAR URL
========================================================= */

function normalizarPath(
  pathname: string
) {
  if (pathname === "/") {
    return "/";
  }

  return pathname.replace(
    /\/+$/,
    ""
  );
}

/* =========================================================
   PROXY
========================================================= */

export async function proxy(
  request: NextRequest
) {
  let supabaseResponse =
    NextResponse.next({
      request,
    });

  /* =======================================================
     SUPABASE
  ======================================================= */

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

          setAll(
            cookiesToSet
          ) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
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
    normalizarPath(
      request.nextUrl.pathname
    );

  /* =======================================================
     1. REDIRECIONAMENTOS PÚBLICOS

     Não rodamos em:
     /admin
     /api
  ======================================================= */

  const deveVerificarRedirect =
    !pathname.startsWith(
      "/admin"
    ) &&
    !pathname.startsWith(
      "/api"
    );

  if (
    deveVerificarRedirect &&
    (
      request.method ===
        "GET" ||
      request.method ===
        "HEAD"
    )
  ) {
    try {
      const {
        data:
          redirectData,
        error:
          redirectError,
      } =
        await supabase
          .from(
            "treinamentos_redirects"
          )
          .select(
            "destino, tipo"
          )
          .eq(
            "origem",
            pathname
          )
          .eq(
            "ativo",
            true
          )
          .maybeSingle();

      if (
        !redirectError &&
        redirectData
      ) {
        const redirect =
          redirectData as RedirectRow;

        /* ===============================================
           SEGURANÇA:
           somente destinos internos
        =============================================== */

        if (
          redirect.destino.startsWith(
            "/"
          )
        ) {
          const destinoUrl =
            new URL(
              redirect.destino,
              request.url
            );

          /* =============================================
             PRESERVAR QUERY STRING / UTM

             Ex.:
             /url-antiga?utm_source=instagram

             vira:
             /url-nova?utm_source=instagram
          ============================================= */

          request.nextUrl.searchParams.forEach(
            (
              value,
              key
            ) => {
              if (
                !destinoUrl.searchParams.has(
                  key
                )
              ) {
                destinoUrl.searchParams.set(
                  key,
                  value
                );
              }
            }
          );

          /* =============================================
             EVITAR LOOP
          ============================================= */

          const destinoPath =
            normalizarPath(
              destinoUrl.pathname
            );

          if (
            destinoPath !==
            pathname
          ) {
            const status:
              RedirectStatus =
              redirect.tipo ===
                302 ||
              redirect.tipo ===
                307 ||
              redirect.tipo ===
                308
                ? redirect.tipo
                : 301;

            return NextResponse.redirect(
              destinoUrl,
              status
            );
          }
        }
      }
    } catch (error) {
      console.error(
        "Erro ao verificar redirecionamento:",
        error
      );

      /*
       * Se houver problema no Supabase,
       * não derrubamos o site.
       */
    }
  }

  /* =======================================================
     2. FORA DO /ADMIN

     Depois de verificar redirects,
     não precisamos validar login.
  ======================================================= */

  const isAdminRoute =
    pathname ===
      "/admin" ||
    pathname.startsWith(
      "/admin/"
    );

  if (!isAdminRoute) {
    return supabaseResponse;
  }

  /* =======================================================
     3. PROTEÇÃO DO ADMIN
  ======================================================= */

  const isLoginPage =
    pathname ===
    "/admin/login";

  /* =======================================================
     VERIFICAR AUTENTICAÇÃO
  ======================================================= */

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();

  const userId =
    claimsData?.claims?.sub;

  /* =======================================================
     NÃO ESTÁ AUTENTICADO
  ======================================================= */

  if (
    claimsError ||
    !userId
  ) {
    /*
     * Login é público.
     */
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
      NextResponse.redirect(
        loginUrl
      );

    supabaseResponse.cookies
      .getAll()
      .forEach(
        (cookie) => {
          redirectResponse.cookies.set(
            cookie
          );
        }
      );

    return redirectResponse;
  }

  /* =======================================================
     USUÁRIO LOGADO
     VERIFICAR ADMIN
  ======================================================= */

  const {
    data: isAdmin,
    error: adminError,
  } =
    await supabase.rpc(
      "treinamentos_is_admin"
    );

  /* =======================================================
     NÃO É ADMIN
  ======================================================= */

  if (
    adminError ||
    isAdmin !== true
  ) {
    /*
     * Permite login para trocar
     * de conta.
     */
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
      .forEach(
        (cookie) => {
          redirectResponse.cookies.set(
            cookie
          );
        }
      );

    return redirectResponse;
  }

  /* =======================================================
     ADMIN JÁ LOGADO TENTANDO ABRIR LOGIN
  ======================================================= */

  if (isLoginPage) {
    const adminUrl =
      request.nextUrl.clone();

    adminUrl.pathname =
      "/admin";

    adminUrl.search = "";

    const redirectResponse =
      NextResponse.redirect(
        adminUrl
      );

    supabaseResponse.cookies
      .getAll()
      .forEach(
        (cookie) => {
          redirectResponse.cookies.set(
            cookie
          );
        }
      );

    return redirectResponse;
  }

  /* =======================================================
     ADMIN AUTENTICADO
  ======================================================= */

  return supabaseResponse;
}

/* =========================================================
   MATCHER

   Agora o proxy precisa enxergar também URLs públicas
   para poder aplicar os redirects.

   Ignoramos:
   - APIs
   - arquivos internos Next
   - imagens
   - fontes
   - css/js
   - arquivos estáticos
========================================================= */

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|eot)$).*)",
  ],
};