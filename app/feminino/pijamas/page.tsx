import CatalogoFeminino from "@/components/catalogoFeminino";

export default function PijamasPage() {
  return (
    <CatalogoFeminino
      categoria="Pijamas"
      titulo="Pijamas e Camisolas"
      descricao="Modelos confortáveis para aproveitar seus momentos de descanso."
      filtros={[
        "Pijamas americanos",
        "Camisolas",
        "Com bojo",
        "Sem bojo",
      ]}
    />
  );
}