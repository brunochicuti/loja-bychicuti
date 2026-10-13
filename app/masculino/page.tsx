
export default function Masculino() {
  const categorias = [
    {
      nome: "Cuecas",
      descricao:
        "Modelos confortáveis, com ótimo ajuste e praticidade para o dia a dia.",
      link: "/masculino/cuecas",
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 pt-32 pb-20">
      <div className="text-center mb-14">
        <p className="text-sm uppercase tracking-widest text-[#863D3D] mb-3">
          By Chicuti
        </p>

        <h1 className="font-serif text-4xl md:text-5xl text-[#5C2A2A]">
          Linha Masculina
        </h1>

        <p className="mt-4 text-[#5C2A2A]/70 max-w-xl mx-auto">
          Conforto, praticidade e estilo para todos os dias.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {categorias.map((categoria) => (
          <a
            key={categoria.nome}
            href={categoria.link}
            className="group bg-[#FFC8C8] min-h-[300px] p-8 flex flex-col justify-end transition-all hover:-translate-y-1"
          >
            <h2 className="font-serif text-3xl text-[#5C2A2A]">
              {categoria.nome}
            </h2>

            <p className="mt-3 text-sm text-[#5C2A2A]/80">
              {categoria.descricao}
            </p>

            <span className="mt-6 text-sm font-medium text-[#863D3D] group-hover:underline">
              Ver produtos →
            </span>
          </a>
        ))}
      </div>
    </main>
  );
}
