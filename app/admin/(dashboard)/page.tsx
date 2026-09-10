"use client";

import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  FileImage,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Link2,
  ListChecks,
  PlusCircle,
  Settings,
  Tags,
  Users,
} from "lucide-react";

/* =========================================================
   TIPOS
========================================================= */

type DashboardLayoutProps = {
  children: ReactNode;
};

type MenuItem = {
  title: string;
  href: string;
  icon: React.ElementType;
};

/* =========================================================
   MENU
========================================================= */

const menuItems: MenuItem[] = [
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
    title: "Banners",
    href: "/admin/banners",
    icon: FileImage,
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

  {
    title: "Conteúdos",
    href: "/admin/conteudos",
    icon: FileText,
  },

  /* =======================================================
     NOVO
  ======================================================= */

  {
    title: "Redirecionamentos",
    href: "/admin/redirecionamentos",
    icon: Link2,
  },

  {
    title: "Configurações",
    href: "/admin/configuracoes",
    icon: Settings,
  },
];

/* =========================================================
   LAYOUT
========================================================= */

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const pathname =
    usePathname();

  /* =======================================================
     VERIFICAR ROTA ATIVA
  ======================================================= */

  function isActive(
    href: string
  ) {
    if (
      href === "/admin"
    ) {
      return (
        pathname === "/admin"
      );
    }

    return pathname.startsWith(
      href
    );
  }

  /* =======================================================
     TREINAMENTOS
  ======================================================= */

  const treinamentoAtivo =
    pathname.startsWith(
      "/admin/treinamentos"
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#f7f8fa]">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-40
          hidden
          w-[260px]
          flex-col
          border-r
          border-zinc-200
          bg-white
          lg:flex
        "
      >

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="flex h-[70px] items-center border-b border-zinc-100 px-6">

          <Link
            href="/admin"
            className="flex items-center gap-3"
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-emerald-600
                text-white
              "
            >
              <GraduationCap
                size={21}
              />
            </div>

            <div>

              <strong className="block text-sm font-bold tracking-wide text-zinc-950">
                2BSUPPLY
              </strong>

              <span className="block text-xs text-zinc-400">
                Treinamentos
              </span>

            </div>

          </Link>

        </div>

        {/* =================================================
            MENU
        ================================================= */}

        <nav className="flex-1 overflow-y-auto px-4 py-6">

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Administração
          </p>

          <div className="space-y-1">

            {/* =============================================
                DASHBOARD
            ============================================= */}

            <SidebarLink
              title="Dashboard"
              href="/admin"
              icon={
                LayoutDashboard
              }
              active={
                pathname ===
                "/admin"
              }
            />

            {/* =============================================
                TREINAMENTOS
            ============================================= */}

            <div>

              <Link
                href="/admin/treinamentos"
                className={`
                  flex
                  min-h-[42px]
                  items-center
                  justify-between
                  rounded-xl
                  px-3
                  text-sm
                  font-medium
                  transition

                  ${
                    treinamentoAtivo
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                  }
                `}
              >

                <div className="flex items-center gap-3">

                  <BookOpen
                    size={19}
                  />

                  <span>
                    Treinamentos
                  </span>

                </div>

                <ChevronDown
                  size={16}
                  className={`
                    transition-transform

                    ${
                      treinamentoAtivo
                        ? "rotate-180"
                        : ""
                    }
                  `}
                />

              </Link>

              {/* ===========================================
                  SUBMENU
              =========================================== */}

              {treinamentoAtivo && (
                <div className="ml-6 mt-1 space-y-1 border-l border-zinc-200 pl-3">

                  <Link
                    href="/admin/treinamentos/novo"
                    className={`
                      flex
                      min-h-[38px]
                      items-center
                      gap-2
                      rounded-lg
                      px-3
                      text-sm
                      transition

                      ${
                        pathname ===
                        "/admin/treinamentos/novo"
                          ? "bg-emerald-50 font-medium text-emerald-700"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }
                    `}
                  >

                    <PlusCircle
                      size={16}
                    />

                    Criar treinamento

                  </Link>

                  <Link
                    href="/admin/treinamentos"
                    className={`
                      flex
                      min-h-[38px]
                      items-center
                      gap-2
                      rounded-lg
                      px-3
                      text-sm
                      transition

                      ${
                        pathname ===
                        "/admin/treinamentos"
                          ? "bg-emerald-50 font-medium text-emerald-700"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }
                    `}
                  >

                    <ListChecks
                      size={16}
                    />

                    Ver treinamentos

                  </Link>

                </div>
              )}

            </div>

            {/* =============================================
                RESTANTE DO MENU
            ============================================= */}

            {menuItems
              .filter(
                (item) =>
                  item.href !==
                  "/admin"
              )
              .map(
                (item) => (
                  <SidebarLink
                    key={
                      item.href
                    }
                    title={
                      item.title
                    }
                    href={
                      item.href
                    }
                    icon={
                      item.icon
                    }
                    active={
                      isActive(
                        item.href
                      )
                    }
                  />
                )
              )}

          </div>

        </nav>

      </aside>

      {/* =================================================
          CONTEÚDO
      ================================================= */}

      <div className="min-h-screen lg:ml-[260px]">

        {children}

      </div>

    </div>
  );
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

function SidebarLink({
  title,
  href,
  icon: Icon,
  active,
}: {
  title: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        flex
        min-h-[42px]
        items-center
        gap-3
        rounded-xl
        px-3
        text-sm
        font-medium
        transition

        ${
          active
            ? "bg-emerald-50 text-emerald-700"
            : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
        }
      `}
    >

      <Icon
        size={19}
      />

      <span>
        {title}
      </span>

    </Link>
  );
}