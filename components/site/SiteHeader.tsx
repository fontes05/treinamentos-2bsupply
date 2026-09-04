"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

export default function SiteHeader() {
  const pathname = usePathname();

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /*
   * Fecha o menu sempre que mudar de página.
   */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  /*
   * Impede o body de rolar enquanto
   * o menu mobile estiver aberto.
   */
  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header className="site-header">
      <div className="container header-content">

        {/* =================================================
            LOGO
        ================================================= */}

        <Link
          href="/"
          className="logo"
          aria-label="Academia Brasileira de Suprimentos"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        >
          {/* Logo para tema escuro */}

          <Image
            src="/logo-2bsupply-treinamentos.png"
            alt="Academia Brasileira de Suprimentos"
            width={190}
            height={55}
            priority
            className="logo-image logo-dark-theme"
          />

          {/* Logo para tema claro */}

          <Image
            src="/logo-2bsupply-treinamentos-light.png"
            alt="Academia Brasileira de Suprimentos"
            width={190}
            height={55}
            priority
            className="logo-image logo-light-theme"
          />
        </Link>


        {/* =================================================
            MENU DESKTOP
        ================================================= */}

        <nav
          className="desktop-nav"
          aria-label="Menu principal"
        >
          <Link
            href="/"
            className={
              pathname === "/"
                ? "active"
                : ""
            }
          >
            Início
          </Link>

          <Link
            href="/cursos"
            className={
              pathname.startsWith(
                "/cursos",
              )
                ? "active"
                : ""
            }
          >
            Todos os cursos
          </Link>

          <Link href="/#depoimentos">
            Depoimentos
          </Link>
        </nav>


        {/* =================================================
            AÇÕES DESKTOP
        ================================================= */}

        <div className="header-actions">

          <Link
            href="/contato"
            className="header-contact"
          >
            <svg
              viewBox="0 0 32 32"
              aria-hidden="true"
              className="header-whatsapp-icon"
            >
              <path d="M16.01 3C8.83 3 3 8.72 3 15.78c0 2.25.6 4.45 1.74 6.39L3 28.5l6.53-1.7a13.1 13.1 0 0 0 6.47 1.68h.01C23.19 28.48 29 22.76 29 15.7 29 8.65 23.19 3 16.01 3Zm0 23.32a10.9 10.9 0 0 1-5.56-1.5l-.4-.24-3.88 1.01 1.04-3.75-.26-.39a10.55 10.55 0 0 1-1.7-5.67c0-5.84 4.83-10.59 10.77-10.59 5.93 0 10.75 4.75 10.75 10.59 0 5.83-4.82 10.54-10.76 10.54Zm5.9-7.92c-.32-.16-1.91-.93-2.21-1.04-.3-.11-.52-.16-.74.16-.22.32-.85 1.04-1.04 1.25-.19.21-.38.24-.71.08-.32-.16-1.36-.49-2.59-1.57-.96-.84-1.61-1.88-1.8-2.2-.19-.32-.02-.49.14-.65.15-.14.32-.37.49-.56.16-.19.22-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.74-1.76-1.01-2.41-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.4-.3.32-1.15 1.12-1.15 2.73 0 1.61 1.19 3.16 1.35 3.38.16.21 2.34 3.51 5.67 4.92.79.34 1.41.54 1.89.69.79.25 1.52.21 2.09.13.64-.09 1.91-.77 2.18-1.51.27-.75.27-1.39.19-1.52-.08-.13-.3-.21-.62-.37Z" />
            </svg>

            Fale conosco
          </Link>

        </div>


        {/* =================================================
            BOTÃO HAMBÚRGUER MOBILE
        ================================================= */}

        <button
          type="button"
          className={`mobile-menu-button ${
            mobileMenuOpen
              ? "mobile-menu-button-open"
              : ""
          }`}
          aria-label={
            mobileMenuOpen
              ? "Fechar menu"
              : "Abrir menu"
          }
          aria-expanded={
            mobileMenuOpen
          }
          onClick={() =>
            setMobileMenuOpen(
              (current) =>
                !current,
            )
          }
        >
          {mobileMenuOpen ? (
            <X size={25} />
          ) : (
            <Menu size={26} />
          )}
        </button>

      </div>


      {/* ===================================================
          MENU MOBILE
      =================================================== */}

      <div
        className={`mobile-menu-overlay ${
          mobileMenuOpen
            ? "mobile-menu-overlay-open"
            : ""
        }`}
        onClick={() =>
          setMobileMenuOpen(false)
        }
      />


      <div
        className={`mobile-menu ${
          mobileMenuOpen
            ? "mobile-menu-open"
            : ""
        }`}
      >
        <nav
          className="mobile-menu-nav"
          aria-label="Menu mobile"
        >

          <Link
            href="/"
            className={
              pathname === "/"
                ? "mobile-menu-active"
                : ""
            }
          >
            <span>
              Início
            </span>

            <ChevronRight />
          </Link>


          <Link
            href="/cursos"
            className={
              pathname.startsWith(
                "/cursos",
              )
                ? "mobile-menu-active"
                : ""
            }
          >
            <span>
              Todos os cursos
            </span>

            <ChevronRight />
          </Link>


          <Link href="/#depoimentos">
            <span>
              Depoimentos
            </span>

            <ChevronRight />
          </Link>

        </nav>


        {/* ===============================================
            BOTÃO CONTATO MOBILE
        =============================================== */}

        <Link
          href="/contato"
          className="mobile-menu-contact"
        >
          <svg
            viewBox="0 0 32 32"
            aria-hidden="true"
          >
            <path d="M16.01 3C8.83 3 3 8.72 3 15.78c0 2.25.6 4.45 1.74 6.39L3 28.5l6.53-1.7a13.1 13.1 0 0 0 6.47 1.68h.01C23.19 28.48 29 22.76 29 15.7 29 8.65 23.19 3 16.01 3Zm0 23.32a10.9 10.9 0 0 1-5.56-1.5l-.4-.24-3.88 1.01 1.04-3.75-.26-.39a10.55 10.55 0 0 1-1.7-5.67c0-5.84 4.83-10.59 10.77-10.59 5.93 0 10.75 4.75 10.75 10.59 0 5.83-4.82 10.54-10.76 10.54Zm5.9-7.92c-.32-.16-1.91-.93-2.21-1.04-.3-.11-.52-.16-.74.16-.22.32-.85 1.04-1.04 1.25-.19.21-.38.24-.71.08-.32-.16-1.36-.49-2.59-1.57-.96-.84-1.61-1.88-1.8-2.2-.19-.32-.02-.49.14-.65.15-.14.32-.37.49-.56.16-.19.22-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.74-1.76-1.01-2.41-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.57.08-.87.4-.3.32-1.15 1.12-1.15 2.73 0 1.61 1.19 3.16 1.35 3.38.16.21 2.34 3.51 5.67 4.92.79.34 1.41.54 1.89.69.79.25 1.52.21 2.09.13.64-.09 1.91-.77 2.18-1.51.27-.75.27-1.39.19-1.52-.08-.13-.3-.21-.62-.37Z" />
          </svg>

          <span>
            Fale conosco
          </span>
        </Link>

      </div>
    </header>
  );
}