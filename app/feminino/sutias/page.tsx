import CatalogoFeminino from "@/components/catalogoFeminino";

export default function SutiasPage() {
  return (
    <CatalogoFeminino
      categoria="Sutiãs"
      titulo="Sutiãs"
      descricao="Encontre sutiãs para diferentes estilos, com conforto e praticidade."
      filtros={[
        "Básicos",
        "Com bojo",
        "Sem bojo",
        "Com renda",
        "Tomara que caia",
        "Amamentação",
        "Senhora",
        "Juvenil",
      ]}
    />
  );
}