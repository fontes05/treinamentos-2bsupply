import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import AssistantWrapper from "@/components/assistant/AssistantWrapper";


const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: {
    default: "Treinamentos | 2BSUPPLY",
    template: "%s | 2BSUPPLY",
  },
  description:
    "Treinamentos especializados em Compras, Suprimentos, Strategic Sourcing, Negociação, Gestão de Contratos e Inteligência Artificial.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-theme="dark" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
<AssistantWrapper />
      </body>
    </html>
  );
}