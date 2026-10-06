"use client";
import Image from "next/image";
import { useState } from "react";
import WhatsAppLink from "./WhatsAppLink";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FBF6F3]/90 backdrop-blur-sm border-b border-[#863D3D]/10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2">
          <Image src="/logo.png" alt="By Chicuti" width={96} height={96} />
          <span className="font-serif text-xl font-semibold text-[#5C2A2A]">
            By Chicuti
          </span>
        </a>

        <nav className="hidden md:block">
          <ul className="flex gap-8 text-sm">
            <li><a href="#feminino" className="hover:text-[#863D3D]">Feminino</a></li>
            <li><a href="#masculino" className="hover:text-[#863D3D]">Masculino</a></li>
            <li><a href="#visitar" className="hover:text-[#863D3D]">Visitar</a></li>
          </ul>
        </nav>

        
         <WhatsAppLink className="hidden md:inline-block bg-[#863D3D] text-[#FBF6F3] px-5 py-2.5 text-sm font-medium hover:bg-[#5C2A2A] transition-colors">
            Falar no WhatsApp
          </WhatsAppLink>

        <button
          className="md:hidden text-[#5C2A2A]"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
        >
          ☰
        </button>
      </div>

      {open && (
        <nav className="md:hidden bg-[#FBF6F3] border-t border-[#863D3D]/10 px-6 py-4">
          <ul className="flex flex-col gap-4 text-sm">
            <li><a href="#feminino" onClick={() => setOpen(false)}>Feminino</a></li>
            <li><a href="#masculino" onClick={() => setOpen(false)}>Masculino</a></li>
            <li><a href="#visitar" onClick={() => setOpen(false)}>Visitar</a></li>
          </ul>
        </nav>
      )}
    </header>
  );
}