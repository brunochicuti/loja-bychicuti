import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "By Chicuti — Moda Íntima Feminina e Masculina",
  description: "Moda íntima feminina e masculina em Dourados/MS.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${workSans.variable} ${workSans.variable} font-sans bg-[#FBF6F3] text-[#2A2420]`}>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JC37V8ZTQH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-JC37V8ZTQH');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}