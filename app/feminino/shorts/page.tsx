import CatalogoFeminino from "@/components/catalogoFeminino";

export default function ShortsFitnessPage() {
  return (
    <CatalogoFeminino
      categoria="Shorts Fitness"
      titulo="Shorts Fitness"
      descricao="Confira nossos shorts fitness para acompanhar seus treinos com conforto."
      filtros={[
        "Meia coxa",
        "Ciclista",
        "Com bolso lateral",
        "Duplo",
      ]}
    />
  );
}