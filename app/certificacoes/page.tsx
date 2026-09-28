import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CertificacoesGrid from "./CertificacoesGrid";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata: Metadata = {
  title: "Certificações | Academia Brasileira de Suprimentos",
  description:
    "Conheça as certificações ISO da 2BSUPPLY em inteligência artificial, privacidade, segurança da informação e qualidade.",
  alternates: {
    canonical: "https://absuprimentos.com.br/certificacoes",
  },
};

const certificacoes = [
  {
    numero: "ISO/IEC 42001:2023",
    nome: "Gestão de Inteligência Artificial",
    descricao:
      "Demonstra nosso compromisso com o uso responsável, seguro e estruturado da inteligência artificial em nossos processos e serviços.",
    imagem: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/certificacao-iso-absuprimentos-01.png",
    pdf: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/iso-42001.pd.pdf",
  },
  {
    numero: "ISO 27701:2019",
    nome: "Gestão da Privacidade da Informação",
    descricao:
      "Representa nosso compromisso com a proteção de dados pessoais e com as práticas de gestão da privacidade da informação.",
    imagem: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/certificacao-iso-absuprimentos-02.png",
    pdf: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/iso-27701.pdf",
  },
  {
    numero: "ISO/IEC 27001:2022",
    nome: "Gestão da Segurança da Informação",
    descricao:
      "Atesta a adoção de um sistema de gestão voltado à segurança das informações da organização e de suas atividades.",
    imagem: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/certificacao-iso-absuprimentos-03.png",
    pdf: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/iso-27001-2.pdf",
  },
  {
    numero: "ISO 9001:2015",
    nome: "Gestão da Qualidade",
    descricao:
      "Reforça nosso compromisso com a gestão da qualidade e a melhoria contínua dos nossos processos e serviços.",
    imagem: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/certificacao-iso-absuprimentos-04.png",
    pdf: "https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/iso-9001.pdf",
  },
] as const;

const css = `


  #certificacoes-page {
    min-height: 100vh;
    background: #020b15;
    color: #f8fbff;
  }

  #certificacoes-page * {
    box-sizing: border-box;
  }

  #certificacoes-page .cert-container {
    width: min(100% - 48px, 1520px);
    margin-inline: auto;
  }

  /* Banner */
  #certificacoes-page .cert-hero {
    overflow: hidden;
    border-top: 1px solid #142130;
    background: linear-gradient(
      105deg,
      #07111e 0%,
      #05171b 65%,
      #06201d 100%
    );
  }

  #certificacoes-page .cert-hero-inner {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, .75fr);
    align-items: center;
    gap: 48px;
    min-height: 450px;
    padding-block: 52px;
  }

  #certificacoes-page .cert-breadcrumb {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 36px;
    color: #a5b4c7;
    font-size: 13px;
  }

  #certificacoes-page .cert-breadcrumb a {
    color: #dce7f2;
    text-decoration: none;
  }

  #certificacoes-page .cert-breadcrumb a:hover {
    color: #55e584;
  }

  #certificacoes-page .cert-breadcrumb span[aria-hidden] {
    color: #76e77d;
    font-size: 20px;
    line-height: 1;
  }

  #certificacoes-page .cert-kicker {
    margin: 0 0 8px;
    color: #53e57d;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: .09em;
    text-transform: uppercase;
  }

  #certificacoes-page .cert-hero h1 {
    max-width: 760px;
    margin: 0;
    color: #fff;
    font-size: clamp(38px, 4.1vw, 58px);
    font-weight: 800;
    letter-spacing: -.045em;
    line-height: 1.08;
  }

  #certificacoes-page .cert-intro {
    max-width: 760px;
    margin: 24px 0 28px;
    color: #d1dae6;
    font-size: clamp(16px, 1.35vw, 19px);
    line-height: 1.6;
  }

  #certificacoes-page .cert-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  #certificacoes-page .cert-tags span {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    padding: 8px 13px;
    border-radius: 5px;
    background: #192633;
    color: #edf7ff;
    font-size: 13px;
    font-weight: 600;
  }

  #certificacoes-page .cert-tags span::before {
    content: "✓";
    margin-right: 8px;
    color: #91e783;
    font-weight: 800;
  }

 

  #certificacoes-page .cert-hero-image img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 66% center;
  }

  /* Área das certificações */
  #certificacoes-page .cert-content {
    padding-block: 48px 60px;
  }

  #certificacoes-page .cert-section-heading {
    margin-bottom: 24px;
  }



  #certificacoes-page .cert-section-heading h2 {
    margin: 0;
    color: #fff;
    font-size: clamp(26px, 3vw, 38px);
    letter-spacing: -.035em;
    font-weight:700;
  }

  #certificacoes-page .cert-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  #certificacoes-page .cert-card {
    display: flex;
    min-width: 0;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #183146;
    border-radius: 14px;
    background: linear-gradient(135deg, #0a1c2a, #06131f);
  }

  /*
   * A imagem ocupa toda a largura, como a capa dos cursos.
   * A proporção original do certificado evita cortes no documento.
   */
  #certificacoes-page .cert-preview {
    display: block;
    width: 100%;
    overflow: hidden;
    background: #fff;
  }

  #certificacoes-page .cert-preview img {
    display: block;
    width: 100%;
    height: auto;
    background: #fff;
    transition: transform .25s ease;
  }

  #certificacoes-page .cert-preview:hover img {
    transform: scale(1.02);
  }

  #certificacoes-page .cert-card-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: flex-start;
    min-width: 0;
    padding: 18px;
  }

  #certificacoes-page .cert-card-label {
    margin: 0 0 10px;
    color: #53e68c;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: .13em;
    text-transform: uppercase;
  }

  #certificacoes-page .cert-card h3 {
    margin: 0 0 8px;
    color: #ffffff;
    font-size: clamp(19px, 1.55vw, 23px);
    letter-spacing: -.035em;
    line-height: 1.15;
    font-weight: 700;
  }

  #certificacoes-page .cert-card h4 {
    margin: 0 0 13px;
    color: #badcf2;
    font-size: 15px;
    line-height: 1.35;
  }

  #certificacoes-page .cert-card-body p {
    margin: 0 0 20px;
    color: #c4d0dc;
    font-size: 13px;
    line-height: 1.5;
  }

  #certificacoes-page .cert-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 42px;
    margin-top: auto;
    padding: 9px 16px;
    border-radius: 7px;
    background: linear-gradient(100deg, #37ed98, #83e45f);
    color: #052013;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
  }

  #certificacoes-page .cert-button:hover {
    filter: brightness(1.08);
  }

  #certificacoes-page a:focus-visible {
    outline: 3px solid #fff;
    outline-offset: 4px;
  }

  #certificacoes-page .cert-notice {
    margin-top: 22px;
    padding: 20px 24px;
    border: 1px solid #183146;
    border-radius: 12px;
    background: #091b29;
  }

  #certificacoes-page .cert-notice p {
    margin: 0 0 4px;
    color: #c4d0dc;
    font-size: 14px;
  }

  #certificacoes-page .cert-notice strong {
    color: #5bea9b;
    font-size: 17px;
  }

  @media (max-width: 1250px) {
    #certificacoes-page .cert-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 850px) {
    #certificacoes-page .cert-hero-inner {
      grid-template-columns: 1fr;
      gap: 28px;
    }

    #certificacoes-page .cert-hero-image {
      height: 290px;
    }
  }

  @media (max-width: 650px) {
    #certificacoes-page .cert-container {
      width: min(100% - 32px, 1520px);
    }

    #certificacoes-page .cert-hero-inner {
      padding-block: 30px 38px;
    }

    #certificacoes-page .cert-breadcrumb {
      gap: 8px;
      margin-bottom: 30px;
      font-size: 12px;
    }

    #certificacoes-page .cert-hero h1 {
      font-size: 41px;
    }

    #certificacoes-page .cert-intro {
      margin-block: 18px 22px;
      font-size: 16px;
    }

    #certificacoes-page .cert-hero-image {
      height: 220px;
    }

    #certificacoes-page .cert-content {
      padding-block: 34px 48px;
    }

    #certificacoes-page .cert-grid {
      grid-template-columns: 1fr;
    }

    #certificacoes-page .cert-card h3 {
      font-size: 23px;
    }

    #certificacoes-page .cert-notice strong {
      overflow-wrap: anywhere;
    }
  }
      #certificacoes-page .cert-hero {
    background-color: #06111e;
    background-image:
      linear-gradient(
        90deg,
        rgba(4, 14, 25, 0.98) 0%,
        rgba(4, 14, 25, 0.90) 38%,
        rgba(4, 14, 25, 0.25) 72%,
        rgba(4, 14, 25, 0) 100%
      ),
      url("https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/banner-certificacoes.png");
    background-repeat: no-repeat, no-repeat;
    background-size: cover, cover;
    background-position: center, center;
  }

  #certificacoes-page .cert-hero-inner {
    grid-template-columns: 1fr;
  }

  #certificacoes-page .cert-hero-inner > div:first-child {
    max-width: 760px;
  }

  @media (max-width: 650px) {
    #certificacoes-page .cert-hero {
      background-image:
        linear-gradient(rgba(4, 14, 25, 0.82), rgba(4, 14, 25, 0.82)),
        url("https://taydbrfqmgvjzelvablx.supabase.co/storage/v1/object/public/Certificacoes/banner-certificacoes.png");
      background-position: center, 70% center;
    }
  }
`;

export default function CertificacoesPage() {
  return (
    <>
      <SiteHeader />

      <main id="certificacoes-page">
        <style dangerouslySetInnerHTML={{ __html: css }} />

        <section className="cert-hero" aria-labelledby="cert-title">
          <div className="cert-container cert-hero-inner">
            <div>
              <nav className="cert-breadcrumb" aria-label="Você está aqui">
                <Link href="/">Início</Link>
                <span aria-hidden="true">›</span>
                <span aria-current="page">Certificações</span>
              </nav>

              <p className="cert-kicker">Compromisso com a excelência</p>
              <h1 id="cert-title">Nossas certificações</h1>

              <p className="cert-intro">
                Qualidade, segurança da informação, privacidade e gestão de
                inteligência artificial fazem parte do compromisso da 2BSUPPLY
                com seus clientes, parceiros e alunos.
              </p>

              <div className="cert-tags" aria-label="Áreas das certificações">
                <span>Inteligência artificial</span>
                <span>Privacidade</span>
                <span>Segurança da informação</span>
                <span>Qualidade</span>
              </div>
            </div>

          </div>
        </section>

        <section
          className="cert-container cert-content"
          aria-labelledby="cert-lista-titulo"
        >
          <div className="cert-section-heading">
            <p>Conheça nossos certificados</p>
            <h2 id="cert-lista-titulo">Certificações ISO</h2>
             <p
            style={{
              marginTop:
                "10px",
              fontWeight:
                "400",
              fontSize:
                "17px",
              lineHeight:
                "1.7",
              opacity:
                0.72,
            }}
          >
          A Academia Brasileira de Suprimentos (AB Suprimentos) faz parte do <b>grupo 2BSUPPLY</b>. <br/>As certificações abaixo foram emitidas em nome da <b>2BSUPPLY CONSULTORIA E TREINAMENTOS LTDA</b> e abrangem as atividades descritas no escopo de cada certificado.
          </p>
          </div>

          <CertificacoesGrid certificacoes={certificacoes} />

        </section>
      </main>

      <SiteFooter />
    </>
  );
}