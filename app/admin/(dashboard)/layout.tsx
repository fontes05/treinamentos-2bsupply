"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  Settings,
  Tags,
  Users,
  Video,
  VideoIcon,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  /* =====================================================
     CONTROLE DOS SUBMENUS
  ===================================================== */

  const treinamentosAberto =
    pathname.startsWith("/admin/treinamentos");

  const videosAberto =
    pathname.startsWith("/admin/videos");

  /* =====================================================
     MENU PADRÃO
  ===================================================== */

  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Categorias",
      href: "/admin/categorias",
      icon: Tags,
    },
{
  title: "Depoimentos",
  href: "/admin/depoimentos",
  icon: Users,
},
    {
      title: "Inscrições",
      href: "/admin/inscricoes",
      icon: GraduationCap,
    },
    {
      title: "Relatórios",
      href: "/admin/relatorios",
      icon: ChartNoAxesCombined,
    },
  ];

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="flex min-h-screen">

        {/* =====================================================
            SIDEBAR
        ===================================================== */}

        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-[#e4e4e7] bg-white lg:flex">

          {/* =====================================================
              LOGO
          ===================================================== */}

          <div className="flex h-[68px] items-center border-b border-[#e4e4e7] px-6">
            <Link
              href="/admin"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009b69] text-white">
                <GraduationCap
                  size={21}
                  strokeWidth={1.8}
                />
              </div>

              <div>
                <p className="text-sm font-bold leading-none !text-[#09090b]">
                  2BSUPPLY
                </p>

                <p className="mt-1 text-xs !text-[#71717a]">
                  Treinamentos
                </p>
              </div>
            </Link>
          </div>

          {/* =====================================================
              MENU
          ===================================================== */}

          <nav className="flex-1 overflow-y-auto px-4 py-6">

            <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-wide !text-[#8b8b97]">
              Administração
            </p>

            <div className="space-y-1">

              {/* =================================================
                  DASHBOARD
              ================================================= */}

              <Link
                href="/admin"
                className={`
                  group flex items-center gap-3 rounded-lg px-3 py-2.5
                  text-sm font-medium transition-all duration-200
                  ${
                    isActive("/admin")
                      ? "bg-emerald-50 !text-emerald-700"
                      : "!text-[#52525b] hover:bg-[#ecfdf5] hover:!text-[#00875a]"
                  }
                `}
              >
                <LayoutDashboard
                  size={19}
                  strokeWidth={1.7}
                  className={
                    isActive("/admin")
                      ? "!text-emerald-600"
                      : "!text-[#8b8b97] group-hover:!text-[#009b69]"
                  }
                />

                Dashboard
              </Link>

              {/* =================================================
                  TREINAMENTOS + SUBMENU
              ================================================= */}

              <div>
                <Link
                  href="/admin/treinamentos"
                  className={`
                    group flex items-center justify-between rounded-lg
                    px-3 py-2.5 text-sm font-medium transition-all
                    ${
                      treinamentosAberto
                        ? "bg-emerald-50 !text-emerald-700"
                        : "!text-[#52525b] hover:bg-[#ecfdf5] hover:!text-[#00875a]"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen
                      size={19}
                      strokeWidth={1.7}
                      className={
                        treinamentosAberto
                          ? "!text-emerald-600"
                          : "!text-[#8b8b97] group-hover:!text-[#009b69]"
                      }
                    />

                    <span>Treinamentos</span>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`
                      transition-transform duration-200
                      ${
                        treinamentosAberto
                          ? "rotate-180 text-emerald-600"
                          : "text-zinc-400"
                      }
                    `}
                  />
                </Link>

                {/* SUBMENU TREINAMENTOS */}

                {treinamentosAberto && (
                  <div className="ml-[21px] mt-2 border-l-2 border-zinc-200 pl-3">
                    <div className="space-y-1">

                      {/* CRIAR TREINAMENTO */}

                      <Link
                        href="/admin/treinamentos/novo"
                        className={`
                          group flex items-center gap-2.5 rounded-lg
                          px-3 py-2.5 text-[13px] font-medium
                          transition-all duration-200
                          ${
                            pathname === "/admin/treinamentos/novo"
                              ? "!bg-emerald-100 !text-emerald-800"
                              : "!text-[#3f3f46] hover:!bg-zinc-100 hover:!text-[#18181b]"
                          }
                        `}
                      >
                        <PlusCircle
                          size={16}
                          strokeWidth={1.8}
                          className={
                            pathname === "/admin/treinamentos/novo"
                              ? "!text-emerald-700"
                              : "!text-[#71717a] group-hover:!text-[#3f3f46]"
                          }
                        />

                        <span>
                          Criar treinamento
                        </span>
                      </Link>

                      {/* VER TREINAMENTOS */}

                      <Link
                        href="/admin/treinamentos"
                        className={`
                          group flex items-center gap-2.5 rounded-lg
                          px-3 py-2.5 text-[13px] font-medium
                          transition-all duration-200
                          ${
                            pathname === "/admin/treinamentos"
                              ? "!bg-emerald-100 !text-emerald-800"
                              : "!text-[#3f3f46] hover:!bg-zinc-100 hover:!text-[#18181b]"
                          }
                        `}
                      >
                        <ListChecks
                          size={16}
                          strokeWidth={1.8}
                          className={
                            pathname === "/admin/treinamentos"
                              ? "!text-emerald-700"
                              : "!text-[#71717a] group-hover:!text-[#3f3f46]"
                          }
                        />

                        <span>
                          Ver treinamentos
                        </span>
                      </Link>

                    </div>
                  </div>
                )}
              </div>

              {/* =================================================
                  VÍDEOS / PRÉVIAS + SUBMENU
              ================================================= */}

              <div>
                <Link
                  href="/admin/videos"
                  className={`
                    group flex items-center justify-between rounded-lg
                    px-3 py-2.5 text-sm font-medium transition-all
                    ${
                      videosAberto
                        ? "bg-emerald-50 !text-emerald-700"
                        : "!text-[#52525b] hover:bg-[#ecfdf5] hover:!text-[#00875a]"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">

                    <Video
                      size={19}
                      strokeWidth={1.7}
                      className={
                        videosAberto
                          ? "!text-emerald-600"
                          : "!text-[#8b8b97] group-hover:!text-[#009b69]"
                      }
                    />

                    <span>
                      Vídeos / Prévias
                    </span>

                  </div>

                  <ChevronDown
                    size={16}
                    className={`
                      transition-transform duration-200
                      ${
                        videosAberto
                          ? "rotate-180 text-emerald-600"
                          : "text-zinc-400"
                      }
                    `}
                  />
                </Link>

                {/* SUBMENU VÍDEOS */}

                {videosAberto && (
                  <div className="ml-[21px] mt-2 border-l-2 border-zinc-200 pl-3">

                    <div className="space-y-1">

                      {/* ADICIONAR VÍDEO */}

                      <Link
                        href="/admin/videos/novo"
                        className={`
                          group flex items-center gap-2.5 rounded-lg
                          px-3 py-2.5 text-[13px] font-medium
                          transition-all duration-200
                          ${
                            pathname === "/admin/videos/novo"
                              ? "!bg-emerald-100 !text-emerald-800"
                              : "!text-[#3f3f46] hover:!bg-zinc-100 hover:!text-[#18181b]"
                          }
                        `}
                      >
                        <PlusCircle
                          size={16}
                          strokeWidth={1.8}
                          className={
                            pathname === "/admin/videos/novo"
                              ? "!text-emerald-700"
                              : "!text-[#71717a] group-hover:!text-[#3f3f46]"
                          }
                        />

                        <span>
                          Adicionar vídeo
                        </span>
                      </Link>

                      {/* VER VÍDEOS */}

                      <Link
                        href="/admin/videos"
                        className={`
                          group flex items-center gap-2.5 rounded-lg
                          px-3 py-2.5 text-[13px] font-medium
                          transition-all duration-200
                          ${
                            pathname === "/admin/videos"
                              ? "!bg-emerald-100 !text-emerald-800"
                              : "!text-[#3f3f46] hover:!bg-zinc-100 hover:!text-[#18181b]"
                          }
                        `}
                      >
                        <VideoIcon
                          size={16}
                          strokeWidth={1.8}
                          className={
                            pathname === "/admin/videos"
                              ? "!text-emerald-700"
                              : "!text-[#71717a] group-hover:!text-[#3f3f46]"
                          }
                        />

                        <span>
                          Ver vídeos
                        </span>
                      </Link>

                    </div>

                  </div>
                )}
              </div>

              {/* =================================================
                  RESTANTE DO MENU
              ================================================= */}

              {menuItems
                .filter(
                  (item) =>
                    item.href !== "/admin"
                )
                .map((item) => {

                  const Icon = item.icon;

                  const active = isActive(
                    item.href
                  );

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group flex items-center gap-3 rounded-lg
                        px-3 py-2.5 text-sm font-medium
                        transition-all duration-200
                        ${
                          active
                            ? "bg-emerald-50 !text-emerald-700"
                            : "!text-[#52525b] hover:bg-[#ecfdf5] hover:!text-[#00875a]"
                        }
                      `}
                    >
                      <Icon
                        size={19}
                        strokeWidth={1.7}
                        className={
                          active
                            ? "!text-emerald-600"
                            : "!text-[#8b8b97] group-hover:!text-[#009b69]"
                        }
                      />

                      {item.title}

                    </Link>
                  );
                })}

            </div>
          </nav>

          {/* =====================================================
              FOOTER SIDEBAR
          ===================================================== */}

          <div className="border-t border-[#e4e4e7] p-4">

            <div className="rounded-xl bg-[#f8f8f9] p-4">

              <p className="text-sm font-semibold !text-[#18181b]">
                Área Administrativa
              </p>

              <p className="mt-1.5 text-xs leading-relaxed !text-[#71717a]">
                Gerencie treinamentos, inscrições e alunos da plataforma.
              </p>

            </div>

          </div>

        </aside>

        {/* =====================================================
            CONTEÚDO
        ===================================================== */}

        <div className="flex min-h-screen flex-1 flex-col lg:pl-[260px]">

          {/* =====================================================
              HEADER
          ===================================================== */}

          <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-[#e4e4e7] bg-white px-6 lg:px-8">

            <div>

              <p className="text-sm !text-[#71717a]">
                Administração
              </p>

              <h1 className="text-lg font-semibold !text-[#18181b]">
                Treinamentos 2BSUPPLY
              </h1>

            </div>

            <div className="flex items-center gap-3">

              <div className="hidden text-right sm:block">

                <p className="text-sm font-semibold !text-[#18181b]">
                  Administrador
                </p>

                <p className="text-xs !text-[#71717a]">
                  comercial@2bsupply.com.br
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ecfdf5] text-sm font-bold !text-[#00875a]">
                AD
              </div>

            </div>

          </header>

          {/* =====================================================
              PÁGINA
          ===================================================== */}

          <main className="flex-1 p-5 lg:p-8">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}