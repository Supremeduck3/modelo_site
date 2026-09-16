import { createSectionDispatcher } from '../dispatchSection';
import FaqAccordion from './FaqAccordion';
import FaqBlocks from './FaqBlocks';
import FaqTwoColumns from './FaqTwoColumns';

const VARIANTS = {
  accordion: FaqAccordion,
  blocks: FaqBlocks,
  'two-columns': FaqTwoColumns,
};

/**
 * Seção "Perguntas frequentes": despacha para a variante visual configurada.
 * Sem itens configurados, renderiza apenas o cabeçalho da seção.
 */
const FaqSection = createSectionDispatcher(VARIANTS);

export default FaqSection;
