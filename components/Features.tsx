const features = [
  { n: "01", title: "Atendimento próximo", text: "Fale direto com quem monta a loja." },
  { n: "02", title: "Peças selecionadas", text: "Escolhidas pela qualidade do tecido e da costura." },
  { n: "03", title: "Troca sem complicação", text: "Tamanho errado? A troca é simples." },
  { n: "04", title: "Compra pelo WhatsApp", text: "Tire dúvidas e feche o pedido sem sair de casa." },
];

export default function Features() {
  return (
    <section className="bg-[#863D3D] text-[#FBF6F3] py-20 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-10">
        {features.map((f) => (
          <div key={f.n}>
            <span className="font-serif text-3xl text-[#FFC8C8]">{f.n}</span>
            <h3 className="font-medium mt-3 mb-2">{f.title}</h3>
            <p className="text-sm text-[#FBF6F3]/80">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}