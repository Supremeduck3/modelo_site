import FaqAccordion from './FaqAccordion';
import FaqBlocks from './FaqBlocks';
import FaqTwoColumns from './FaqTwoColumns';

const VARIANTS = {
  accordion: FaqAccordion,
  blocks: FaqBlocks,
  'two-columns': FaqTwoColumns,
};

/** Seção "Perguntas frequentes": despacha para a variante visual configurada. */
export default function FaqSection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? FaqAccordion;

  return <Variant id={id} content={content} />;
}
