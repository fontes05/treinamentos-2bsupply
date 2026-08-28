import Image from "next/image";
import Link from "next/link";

/* =========================================================
   SITE FOOTER
========================================================= */

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* MARCA */}

        <div className="footer-brand">
          <Link
            href="/"
            className="logo footer-logo"
          >
            <Image
              src="/logo-academia-brasileira-de-suprimentos-1.png"
              alt="Academia Brasileira de Suprimentos"
              width={190}
              height={55}
              className="logo-image logo-dark-theme"
            />

            <Image
              src="/logo-2bsupply-treinamentos-light.png"
              alt="Academia Brasileira de Suprimentos"
              width={190}
              height={55}
              className="logo-image logo-light-theme"
            />
          </Link>

          <p className="footer-description">
            Conhecimento, tecnologia e estratégia para
            transformar a área de Compras e Suprimentos.
          </p>
        </div>
      </div>

      {/* RODAPÉ INFERIOR */}

      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} 2BSUPPLY. Todos os
          direitos reservados.
        </span>

        <span>
          Conhecimento de Supply que transforma.
        </span>
      </div>
    </footer>
  );
}