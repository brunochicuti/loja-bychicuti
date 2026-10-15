export default function Feminino() {
  const categorias = [
    {
      nome: "Calcinhas",
      descricao:
        "Modelos confortáveis para o dia a dia e diferentes ocasiões.",
      link: "/feminino/calcinhas",
    },
    /*{
      nome: "Sutiãs",
      descricao:
        "Modelos para diferentes estilos, com conforto e praticidade.",
      link: "/feminino/sutias",
    },
    {
      nome: "Tops Fitness",
      descricao:
        "Modelos confortáveis e versáteis para o dia a dia e diferentes ocasiões.",
      link: "/feminino/tops",
    },
    {
      nome: "Short",
      descricao:
        "Tecido leve e secagem rápida para dar total liberdade nos seus treinos.",
      link: "/feminino/shorts",
    },
    {
      nome: "Pijamas",
      descricao:
        "Modelos confortáveis e aconchegantes para o dia a dia e noites de descanso.",
      link: "/feminino/pijamas",
    },
    {
      nome: "Body",
      descricao:
        "Bodys versáteis e confortáveis que garantem firmeza e elegância em qualquer produção.",
      link: "/feminino/body",
    },
    {
      nome: "Blusas",
      descricao:
        "Modelos leves e versáteis para renovar o seu guarda-roupa com estilo em qualquer ocasião.",
      link: "/feminino/blusas",
    },
    {
      nome: "Calças",
      descricao:
        "O fit ideal para o seu corpo com a versatilidade que o seu guarda-roupa precisa.",
      link: "/feminino/calcas",
    },
    {
      nome: "Maiôs",
      descricao:
        "Peças marcantes com tecidos de alta qualidade para curtir os dias ensolarados com muito charme.",
      link: "/feminino/maios",
    },*/


  ];

  return (
    <main className="max-w-6xl mx-auto px-6 pt-20 pb-20">
      <div className="text-center mb-14">
        <p className="text-sm uppercase tracking-widest text-[#863D3D] mb-3">
          By Chicuti
        </p>

        <h1 className="font-serif text-4xl md:text-5xl text-[#5C2A2A]">
          Linha Feminina
        </h1>

        <p className="mt-4 text-[#5C2A2A]/70 max-w-xl mx-auto">
          Encontre a peça ideal para você.
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