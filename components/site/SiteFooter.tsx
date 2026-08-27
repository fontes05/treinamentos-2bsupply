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
            className="logo"
          >
            <Image
              src="/logo-2bsupply-treinamentos.png"
              alt="2BSUPPLY Treinamentos"
              width={190}
              height={55}
              className="logo-image logo-dark-theme"
            />

            <Image
              src="/logo-2bsupply-treinamentos-light.png"
              alt="2BSUPPLY Treinamentos"
              width={190}
              height={55}
              className="logo-image logo-light-theme"
            />
          </Link>

          <p>
            Conhecimento, tecnologia e estratégia
            para transformar a área de Compras e
            Suprimentos.
          </p>
        </div>

        {/* NAVEGAÇÃO */}

        <div className="footer-column">
          <strong>
            Navegação
          </strong>

          <Link href="/">
            Início
          </Link>

          <Link href="/todos">
            Todos os cursos
          </Link>

          <Link href="/#areas">
            Áreas
          </Link>

          <Link href="/sobre">
            Sobre
          </Link>
        </div>

        {/* TREINAMENTOS */}

        <div className="footer-column">
          <strong>
            Treinamentos
          </strong>

          <Link href="/todos">
            Strategic Sourcing
          </Link>

          <Link href="/todos">
            Negociação
          </Link>

          <Link href="/todos">
            Contratos
          </Link>

          <Link href="/todos">
            IA em Suprimentos
          </Link>
        </div>

        {/* 2BSUPPLY */}

        <div className="footer-column">
          <strong>
            2BSUPPLY
          </strong>

          <Link href="/contato">
            Contato
          </Link>

          <Link href="/#empresas">
            Para empresas
          </Link>

          <Link href="/privacidade">
            Política de privacidade
          </Link>
        </div>
      </div>

      {/* RODAPÉ INFERIOR */}

      <div className="container footer-bottom">
        <span>
          ©{" "}
          {new Date().getFullYear()}{" "}
          2BSUPPLY. Todos os direitos reservados.
        </span>

        <span>
          Conhecimento de Supply que transforma.
        </span>
      </div>
    </footer>
  );
}