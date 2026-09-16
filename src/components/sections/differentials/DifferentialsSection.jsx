import { createSectionDispatcher } from '../dispatchSection';
import DifferentialsCards from './DifferentialsCards';
import DifferentialsIcons from './DifferentialsIcons';
import DifferentialsSideBlocks from './DifferentialsSideBlocks';

const VARIANTS = {
  icons: DifferentialsIcons,
  cards: DifferentialsCards,
  'side-blocks': DifferentialsSideBlocks,
};

/**
 * Seção "Diferenciais": despacha para a variante visual configurada.
 * Sem itens configurados, renderiza apenas o cabeçalho da seção.
 */
const DifferentialsSection = createSectionDispatcher(VARIANTS);

export default DifferentialsSection;
