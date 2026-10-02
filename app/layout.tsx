import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { Geist } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";

import { cn } from "@/lib/utils";
import AssistantWrapper from "@/components/assistant/AssistantWrapper";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
    <html
      lang="pt-BR"
      data-theme="dark"
      className={cn("font-sans", geist.variable)}
    >
      <body>
        {children}

        <AssistantWrapper />
      </body>

      <GoogleAnalytics
        gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!}
      />

      <Script id="google-ads-config" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];

          window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
          };

          window.gtag('config', 'AW-16466345390');

          window.gtag_report_conversion = function (url) {
            var redirected = false;
            var timer;

            var callback = function () {
              if (redirected) return;

              redirected = true;
              window.clearTimeout(timer);

              if (typeof url === 'string' && url) {
                window.location.assign(url);
              }
            };

            // Abre a Hotmart mesmo se o rastreamento demorar.
            timer = window.setTimeout(callback, 1800);

            try {
              window.gtag('event', 'conversion', {
                'send_to': 'AW-16466345390/6dANCM-qs40dEK774as9',
                'event_callback': callback,
                'event_timeout': 1500
              });
            } catch (error) {
              callback();
            }

            return false;
          };
        `}
      </Script>
    </html>
  );
}