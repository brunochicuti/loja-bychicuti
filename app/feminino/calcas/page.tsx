import CatalogoFeminino from "@/components/catalogoFeminino";

export default function CalcasPage() {
  return (
    <CatalogoFeminino
      categoria="Calças"
      titulo="Calças"
      descricao="Encontre calças confortáveis para acompanhar sua rotina e seus treinos."
      filtros={[
        "Legging",
        "Com bolso",
        "Bailarina",
      ]}
    />
  );
}