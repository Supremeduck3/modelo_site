import DifferentialsCards from './DifferentialsCards';
import DifferentialsIcons from './DifferentialsIcons';
import DifferentialsSideBlocks from './DifferentialsSideBlocks';

const VARIANTS = {
  icons: DifferentialsIcons,
  cards: DifferentialsCards,
  'side-blocks': DifferentialsSideBlocks,
};

/** Seção "Diferenciais": despacha para a variante visual configurada. */
export default function DifferentialsSection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? DifferentialsIcons;

  return <Variant id={id} content={content} />;
}
