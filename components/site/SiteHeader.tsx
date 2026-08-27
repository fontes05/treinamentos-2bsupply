"use client";

import Image from "next/image";
import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

/* =========================================================
   SITE HEADER
========================================================= */

export default function SiteHeader() {
  const [
    theme,
    setTheme,
  ] = useState<
    "dark" | "light"
  >("dark");

  const [
    mounted,
    setMounted,
  ] = useState(false);

  /* =======================================================
     TEMA
  ======================================================= */

  useEffect(() => {
    const savedTheme =
      localStorage.getItem(
        "2bsupply-training-theme",
      ) as
        | "dark"
        | "light"
        | null;

    const initialTheme =
      savedTheme ||
      "dark";

    setTheme(
      initialTheme,
    );

    document.documentElement.setAttribute(
      "data-theme",
      initialTheme,
    );

    setMounted(
      true,
    );
  }, []);

  function toggleTheme() {
    const newTheme =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(
      newTheme,
    );

    localStorage.setItem(
      "2bsupply-training-theme",
      newTheme,
    );

    document.documentElement.setAttribute(
      "data-theme",
      newTheme,
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <header className="site-header">
      <div className="container header-content">
        {/* LOGO */}

        <Link
          href="/"
          className="logo"
        >
          {/* TEMA ESCURO */}

          <Image
            src="/logo-2bsupply-treinamentos.png"
            alt="2BSUPPLY Treinamentos"
            width={190}
            height={55}
            priority
            className="logo-image logo-dark-theme"
          />

          {/* TEMA CLARO */}

          <Image
            src="/logo-2bsupply-treinamentos-light.png"
            alt="2BSUPPLY Treinamentos"
            width={190}
            height={55}
            priority
            className="logo-image logo-light-theme"
          />
        </Link>

        {/* MENU */}

        <nav className="desktop-nav">
          <Link href="/">
            Início
          </Link>

          <Link href="/todos">
            Todos os cursos
          </Link>

          <Link href="/#depoimentos">
            Depoimentos
          </Link>
        </nav>

        {/* AÇÕES */}

        <div className="header-actions">
          <Link
            href="/contato"
            className="header-contact"
          >
            Fale conosco
          </Link>

          <button
            type="button"
            className="theme-button"
            onClick={
              toggleTheme
            }
            aria-label="Alternar tema"
          >
            {mounted &&
            theme ===
              "dark" ? (
              <SunIcon />
            ) : (
              <MoonIcon />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   ÍCONES
========================================================= */

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="4"
      />

      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.5 14.3A8 8 0 019.7 3.5 8.5 8.5 0 1020.5 14.3z" />
    </svg>
  );
}