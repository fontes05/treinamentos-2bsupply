import Image from "next/image";
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-brand-logos">
            <Link
              href="/"
              className="logo footer-logo"
              aria-label="Página inicial da Academia Brasileira de Suprimentos"
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

            <a
              href="https://2bsupply.com.br/"
              className="footer-2bsupply-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar o site da 2BSUPPLY"
            >
              <img
                src="https://2bsupply.com.br/wp-content/uploads/2023/12/logo-2b-supply.png"
                alt="2BSUPPLY"
                width={170}
                height={60}
                loading="lazy"
                className="footer-2bsupply-image"
              />
            </a>
          </div>

          <p className="footer-description">
            Conhecimento, tecnologia e estratégia para
            transformar a área de Compras e Suprimentos.
          </p>

          <p
  className="footer-cnpj"
  style={{
    marginTop: "20px",
    fontSize: "14px",
    opacity: 0.75,
  }}
>
  CNPJ: 36.335.299/0001-82
</p>
        </div>

        <Link
          href="/certificacoes"
          className="footer-certifications"
          aria-label="Conheça as certificações da 2BSUPPLY"
        >
          <span className="footer-certifications-title">Certificações</span>
          <span className="footer-certifications-logos">
            <Image
              src="https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/selo-iso-42001-2.png"
              alt="ISO/IEC 42001"
              width={100}
              height={100}
              className="footer-certification-image"
            />
            <Image
              src="https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/selo-iso-27001-1.png"
              alt="ISO/IEC 27001"
              width={100}
              height={100}
              className="footer-certification-image"
            />
            <Image
              src="https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/selo-iso-27701-2.png"
              alt="ISO/IEC 27701"
              width={100}
              height={100}
              className="footer-certification-image"
            />
            <Image
              src="https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/selo-iso-9001.png"
              alt="ISO 9001"
              width={100}
              height={100}
              className="footer-certification-image"
            />
          </span>
        </Link>
      </div>

      <div className="container footer-bottom">
        <div>
          <span>
            © {new Date().getFullYear()} 2BSUPPLY. Todos os direitos reservados.
          </span>

        </div>

        <span>Conhecimento de Supply que transforma.</span>
      </div>
    </footer>
  );
}