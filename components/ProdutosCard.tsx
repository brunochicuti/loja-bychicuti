import Image from "next/image";

type Produtos = {
  nome: string;
  preco: string;
  imagem: string;
};

export default function ProdutosCard({ nome, preco, imagem }: Produtos) {
  return (
    <div>
      <div className="relative aspect-[3/4] bg-[#FFE3E3] mb-3">
        <Image
          src={imagem}
          alt={nome}
          fill
          className="object-cover"
        />
      </div>

      <div>
        <h3 className="font-medium text-[#2A2420]">{nome}</h3>
        <p className="text-[#863D3D]">{preco}</p>
      </div>
    </div>
  );
}