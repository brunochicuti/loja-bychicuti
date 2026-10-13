import CatalogoFeminino from "@/components/catalogoFeminino";

export default function TopsPage() {
  return (
    <CatalogoFeminino
      categoria="Tops"
      titulo="Tops"
      descricao="Encontre tops infantis e fitness para diferentes estilos e necessidades."
      filtros={[
        "Infantil",
        "Com bojo",
        "Sem bojo",
        "Nadador",
        "Costa em V",
        "Alça cruzada",
        "Recorte nas costas",
      ]}
    />
  );
}