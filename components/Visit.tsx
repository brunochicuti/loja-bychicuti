export default function Visit() {
  return (
    <section id="visitar" className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12">
      <div>
        <h2 className="font-serif text-3xl text-[#5C2A2A] mb-6">
          Venha conhecer
        </h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-[#863D3D] font-medium">Endereço</p>
            <p>Br 163 km288 — <br></br>Travessão Maria Curandeira, Douradina/MS</p>
          </div>
          <div>
            <p className="text-[#863D3D] font-medium">Horário</p>
            <p>Segunda a Sexta, das 7h às 18h<br></br>
              Sábado, das 7h às 12h</p>
          </div>
          <div>
            <p className="text-[#863D3D] font-medium">Contato</p>
            <p>(67) 99691-0734</p>
          </div>
        </div>
      </div>

      <div className="bg-[#FFC8C8] flex items-center justify-center p-10 text-center">
        
          <a href="https://wa.me/message/GSDJGPZA2QRKA1"
          target="_blank"
          className="bg-[#863D3D] text-[#FBF6F3] px-8 py-4 font-medium hover:bg-[#5C2A2A] transition-colors"
        >
          Chamar no WhatsApp
        </a>
      </div>
    </section>
  );
}