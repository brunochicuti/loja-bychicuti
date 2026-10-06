import WhatsAppLink from "./WhatsAppLink";
export default function Visit() {
  return (
    <section
      id="visitar"
      className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12"
    >
      <div>
        <h2 className="font-serif text-3xl text-[#5C2A2A] mb-6">
          Venha conhecer
        </h2>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-[#863D3D] font-medium">Endereço</p>
            <p>
              Br 163 km288 — <br />
              Travessão Maria Curandeira, Douradina/MS
            </p>
          </div>

          <div>
            <p className="text-[#863D3D] font-medium">Horário</p>
            <p>
              Segunda a Sexta, das 7h às 18h
              <br />
              Sábado, das 7h às 12h
            </p>
          </div>

          <div>
            <p className="text-[#863D3D] font-medium">Contato</p>
            <p>(67) 99691-0734</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* MAPA */}
        <div className="w-full h-[350px] overflow-hidden rounded-2xl">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d681.982250967217!2d-54.570455365714594!3d-22.079873581331423!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94891d005bb253e1%3A0xe494838a6cb342c1!2sByChicuti!5e1!3m2!1spt-BR!2sbr!4v1790876921534!5m2!1spt-BR!2sbr"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Localização da ByChicuti"
          />
        </div>

        {/* WHATSAPP */}
        <WhatsAppLink className="bg-[#863D3D] text-[#FBF6F3] px-8 py-4 font-medium text-center hover:bg-[#5C2A2A] transition-colors">
          Chamar no WhatsApp
        </WhatsAppLink>
      </div>
    </section>
  );
}