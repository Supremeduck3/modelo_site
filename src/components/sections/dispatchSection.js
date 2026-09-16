import Section from '@/components/ui/Section';

/**
 * Cria o dispatcher de uma seção baseada em lista de itens.
 *
 * Centraliza duas regras que não pertencem à apresentação: escolher a variante
 * (com fallback para a primeira) e decidir o que fazer quando não há itens.
 * Assim, uma variante nova não precisa relembrar a guarda de estado vazio.
 */
export function createSectionDispatcher(
  variants,
  { requireItems = true } = {},
) {
  const fallbackKey = Object.keys(variants)[0];

  return function SectionDispatcher({ id, variant, content = {} }) {
    const Variant = variants[variant] ?? variants[fallbackKey];

    if (requireItems && !(content.items?.length > 0)) {
      return (
        <Section id={id} title={content.title} subtitle={content.subtitle} />
      );
    }

    return <Variant id={id} content={content} />;
  };
}
