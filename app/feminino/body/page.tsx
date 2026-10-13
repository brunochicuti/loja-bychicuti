import CatalogoFeminino from "@/components/catalogoFeminino";

export default function BodyPage() {
  return (
    <CatalogoFeminino
      categoria="Body"
      titulo="Bodies"
      descricao="Descubra modelos de body para compor diferentes looks."
      filtros={["Gola alta"]}
    />
  );
}