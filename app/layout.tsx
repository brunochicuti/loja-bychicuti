import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

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
      <body className={`${fraunces.variable} ${workSans.variable} font-sans bg-[#FBF6F3] text-[#2A2420]`}>
        {children}
      </body>
    </html>
  );
}