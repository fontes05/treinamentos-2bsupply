"use client";

import { useState } from "react";
import Image from "next/image";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Certificacao = {
  numero: string;
  nome: string;
  descricao: string;
  imagem: string;
  pdf: string;
};

type Props = {
  certificacoes: readonly Certificacao[];
};

export default function CertificacoesGrid({ certificacoes }: Props) {
  const [selecionado, setSelecionado] = useState<Certificacao | null>(null);

  return (
    <>
      <style>{`
        [data-slot="dialog-overlay"] {
          background: rgba(0, 5, 14, 0.78);
          backdrop-filter: blur(5px);
        }
      `}</style>

      <div className="cert-grid">
        {certificacoes.map((certificado) => (
          <article className="cert-card" key={certificado.numero}>
            <button
              type="button"
              className="cert-preview"
              onClick={() => setSelecionado(certificado)}
              aria-label={`Visualizar certificado ${certificado.numero}`}
              style={{ border: 0, padding: 0, cursor: "zoom-in" }}
            >
              <Image
                src={certificado.imagem}
                alt={`Arte da certificação ${certificado.numero}`}
                width={606}
                height={377}
                sizes="(max-width: 650px) 100vw, (max-width: 1250px) 50vw, 25vw"
              />
            </button>

            <div className="cert-card-body">
              <span className="cert-card-label">Certificação</span>
              <h3>{certificado.numero}</h3>
              <h4>{certificado.nome}</h4>
              <p>{certificado.descricao}</p>

              <button
                type="button"
                className="cert-button"
                onClick={() => setSelecionado(certificado)}
                style={{ border: 0, cursor: "pointer" }}
              >
                Ver certificado <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={selecionado !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setSelecionado(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="!w-[94vw] !max-w-[1100px] !gap-0 overflow-hidden !border !border-[#183146] !bg-[#020812] !p-0 text-white shadow-2xl"
        >
          <DialogClose
            aria-label="Fechar certificado"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-md text-2xl text-white hover:bg-white/10"
          >
            ×
          </DialogClose>

          <DialogHeader className="!gap-1 px-6 py-5 pr-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#53e68c]">
              Certificado da 2BSUPPLY
            </span>

            <DialogTitle className="text-left text-xl font-bold leading-tight text-white md:text-2xl">
              {selecionado?.numero} — {selecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          {selecionado && (
            <iframe
              key={selecionado.pdf}
              src={selecionado.pdf}
              title={`Certificado ${selecionado.numero} em PDF`}
              className="block w-full border-0 bg-white"
              style={{ height: "min(70vh, 760px)" }}
            />
          )}

          <div className="flex justify-end border-t border-white/10 px-6 py-3">
            {selecionado && (
              <a
                href={selecionado.pdf}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#53e68c] hover:underline"
              >
                Abrir PDF em nova aba ↗
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}