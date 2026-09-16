import TeamCards from './TeamCards';
import TeamHighlight from './TeamHighlight';
import TeamList from './TeamList';

const VARIANTS = {
  cards: TeamCards,
  list: TeamList,
  highlight: TeamHighlight,
};

/** Seção "Equipe": despacha para a variante visual configurada. */
export default function TeamSection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? TeamCards;

  return <Variant id={id} content={content} />;
}
