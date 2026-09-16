import { createSectionDispatcher } from '../dispatchSection';
import TeamCards from './TeamCards';
import TeamHighlight from './TeamHighlight';
import TeamList from './TeamList';

const VARIANTS = {
  cards: TeamCards,
  list: TeamList,
  highlight: TeamHighlight,
};

/**
 * Seção "Equipe": despacha para a variante visual configurada.
 * Sem itens configurados, renderiza apenas o cabeçalho da seção.
 */
const TeamSection = createSectionDispatcher(VARIANTS);

export default TeamSection;
