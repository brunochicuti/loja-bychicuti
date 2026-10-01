export default function Categories() {
  return (
    <section className="px-6 max-w-6xl mx-auto py-20 grid md:grid-cols-2 gap-6">
      <div id="feminino" className="bg-[#FFC8C8] p-10 min-h-[320px] flex flex-col justify-end">
        <h3 className="font-serif text-2xl text-[#5C2A2A] mb-2">
          Linha feminina
        </h3>
        <p className="text-sm text-[#5C2A2A] max-w-xs mb-4">
          Sutiãs, calcinhas e pijamas para o dia a dia e ocasiões especiais.
        </p>
        
          <a href="https://wa.me/message/GSDJGPZA2QRKA1"
          target="_blank"
          className="text-sm font-medium underline w-fit">
          Ver opções
        </a>
      </div>

      <div
        id="masculino"
        className="bg-[#5C2A2A] text-[#FBF6F3] p-10 min-h-[320px] flex flex-col justify-end"
      >
        <h3 className="font-serif text-2xl mb-2">Linha masculina</h3>
        <p className="text-sm text-[#FBF6F3]/80 max-w-xs mb-4">
          Cuecas e roupas de baixo em algodão e tecidos técnicos.
        </p>
        
          <a href="https://wa.me/message/GSDJGPZA2QRKA1"
          target="_blank"
          className="text-sm font-medium underline w-fit">
          Ver opções
        </a>
      </div>
    </section>
  );
}