"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  BookOpen,
  ChartNoAxesCombined,
  ChevronDown,
  CircleDollarSign,
  FileText,
  GraduationCap,
  ImageIcon,
  LayoutDashboard,
  Link2,
  ListChecks,
  PlusCircle,
  Search,
  Settings,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";

const menuItems = [
  {
    title: "Categorias",
    href: "/admin/categorias",
    icon: Tags,
  },
  {
    title: "Banners",
    href: "/admin/banners",
    icon: ImageIcon,
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
    title: "Custos e Rentabilidade",
    href: "/admin/rentabilidade",
    icon: CircleDollarSign,
  },
  {
    title: "Conteúdos",
    href: "/admin/conteudos",
    icon: FileText,
  },
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

const seoItems = [
  {
    title: "SEO das páginas",
    href: "/admin/seo/paginas",
    icon: FileText,
  },
  {
    title: "SEO dos cursos",
    href: "/admin/seo/cursos",
    icon: GraduationCap,
  },
  {
    title: "Configurações gerais",
    href: "/admin/seo/configuracoes",
    icon: Settings,
  },
];

function matchesRoute(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuLink({
  title,
  href,
  icon: Icon,
  active,
  submenu = false,
}: {
  title: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  submenu?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`
        group flex items-center rounded-lg font-medium
        transition-all duration-200
        ${submenu ? "gap-2.5 px-3 py-2.5 text-[13px]" : "gap-3 px-3 py-2.5 text-sm"}
        ${
          active
            ? submenu
              ? "!bg-emerald-100 !text-emerald-800"
              : "bg-emerald-50 !text-emerald-700"
            : submenu
              ? "!text-[#3f3f46] hover:!bg-zinc-100 hover:!text-[#18181b]"
              : "!text-[#52525b] hover:bg-[#ecfdf5] hover:!text-[#00875a]"
        }
      `}
    >
      <Icon
        size={submenu ? 16 : 19}
        strokeWidth={submenu ? 1.8 : 1.7}
        className={
          active
            ? "!text-emerald-600"
            : "!text-[#8b8b97] group-hover:!text-[#009b69]"
        }
      />

      <span>{title}</span>
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const treinamentosAberto = matchesRoute(
    pathname,
    "/admin/treinamentos"
  );

  const seoAtivo = matchesRoute(pathname, "/admin/seo");

  // Guarda a escolha de abrir/fechar somente na rota atual.
  // Ao navegar para uma tela de SEO, o submenu abre automaticamente.
  const [seoToggle, setSeoToggle] = useState<{
    pathname: string;
    open: boolean;
  } | null>(null);

  const seoAberto =
    seoToggle?.pathname === pathname
      ? seoToggle.open
      : seoAtivo;

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-[#e4e4e7] bg-white lg:flex">
          {/* LOGO */}
          <div className="flex h-[68px] shrink-0 items-center border-b border-[#e4e4e7] px-6">
            <Link
              href="/admin"
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009b69] text-white">
                <GraduationCap size={21} strokeWidth={1.8} />
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

          {/* MENU */}
          <nav
            aria-label="Menu administrativo"
            className="flex-1 overflow-y-auto px-4 py-6"
          >
            <p className="mb-4 px-3 text-[11px] font-semibold uppercase tracking-wide !text-[#8b8b97]">
              Administração
            </p>

            <div className="space-y-1">
              <MenuLink
                title="Dashboard"
                href="/admin"
                icon={LayoutDashboard}
                active={pathname === "/admin"}
              />

              {/* TREINAMENTOS */}
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
                  <span className="flex items-center gap-3">
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
                  </span>

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

                {treinamentosAberto && (
                  <div className="ml-[21px] mt-2 border-l-2 border-zinc-200 pl-3">
                    <div className="space-y-1">
                      <MenuLink
                        title="Criar treinamento"
                        href="/admin/treinamentos/novo"
                        icon={PlusCircle}
                        active={pathname === "/admin/treinamentos/novo"}
                        submenu
                      />

                      <MenuLink
                        title="Ver treinamentos"
                        href="/admin/treinamentos"
                        icon={ListChecks}
                        active={pathname === "/admin/treinamentos"}
                        submenu
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* RESTANTE DO MENU */}
              {menuItems.map((item) => (
                <MenuLink
                  key={item.href}
                  title={item.title}
                  href={item.href}
                  icon={item.icon}
                  active={matchesRoute(pathname, item.href)}
                />
              ))}

              {/* SEO */}
              <div>
                <button
                  type="button"
                  aria-expanded={seoAberto}
                  aria-controls="admin-seo-submenu"
                  onClick={() =>
                    setSeoToggle({
                      pathname,
                      open: !seoAberto,
                    })
                  }
                  className={`
                    group flex w-full items-center justify-between
                    rounded-lg px-3 py-2.5 text-left text-sm
                    font-medium transition-all duration-200
                    ${
                      seoAtivo || seoAberto
                        ? "bg-emerald-50 !text-emerald-700"
                        : "!text-[#52525b] hover:bg-[#ecfdf5] hover:!text-[#00875a]"
                    }
                  `}
                >
                  <span className="flex items-center gap-3">
                    <Search
                      size={19}
                      strokeWidth={1.7}
                      className={
                        seoAtivo || seoAberto
                          ? "!text-emerald-600"
                          : "!text-[#8b8b97] group-hover:!text-[#009b69]"
                      }
                    />

                    <span>SEO</span>
                  </span>

                  <ChevronDown
                    size={16}
                    className={`
                      transition-transform duration-200
                      ${
                        seoAberto
                          ? "rotate-180 text-emerald-600"
                          : "text-zinc-400"
                      }
                    `}
                  />
                </button>

                <div
                  id="admin-seo-submenu"
                  hidden={!seoAberto}
                  className="ml-[21px] mt-2 border-l-2 border-zinc-200 pl-3"
                >
                  <div className="space-y-1">
                    {seoItems.map((item) => (
                      <MenuLink
                        key={item.href}
                        title={item.title}
                        href={item.href}
                        icon={item.icon}
                        active={matchesRoute(pathname, item.href)}
                        submenu
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* FOOTER SIDEBAR */}
          <div className="shrink-0 border-t border-[#e4e4e7] p-4">
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

        {/* CONTEÚDO */}
        <div className="flex min-h-screen flex-1 flex-col lg:pl-[260px]">
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

          <main className="flex-1 p-5 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}