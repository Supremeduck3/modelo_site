import { createSectionDispatcher } from '../dispatchSection';
import ServicesCards from './ServicesCards';
import ServicesFeature from './ServicesFeature';
import ServicesGrid from './ServicesGrid';
import ServicesImageText from './ServicesImageText';
import ServicesList from './ServicesList';

const VARIANTS = {
  cards: ServicesCards,
  list: ServicesList,
  grid: ServicesGrid,
  'image-text': ServicesImageText,
  feature: ServicesFeature,
};

/**
 * Seção "Serviços": despacha para a variante visual configurada.
 * Sem itens configurados, renderiza apenas o cabeçalho da seção.
 */
const ServicesSection = createSectionDispatcher(VARIANTS);

export default ServicesSection;
