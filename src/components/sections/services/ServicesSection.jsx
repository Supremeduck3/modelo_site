import ServicesCards from './ServicesCards';
import ServicesGrid from './ServicesGrid';
import ServicesImageText from './ServicesImageText';
import ServicesList from './ServicesList';

const VARIANTS = {
  cards: ServicesCards,
  list: ServicesList,
  grid: ServicesGrid,
  'image-text': ServicesImageText,
};

/** Seção "Serviços": despacha para a variante visual configurada. */
export default function ServicesSection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? ServicesCards;

  return <Variant id={id} content={content} />;
}
