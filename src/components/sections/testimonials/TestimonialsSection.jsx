import { createSectionDispatcher } from '../dispatchSection';
import TestimonialsCards from './TestimonialsCards';
import TestimonialsSingle from './TestimonialsSingle';
import TestimonialsSlider from './TestimonialsSlider';

const VARIANTS = {
  cards: TestimonialsCards,
  slider: TestimonialsSlider,
  single: TestimonialsSingle,
};

/**
 * Seção "Depoimentos": despacha para a variante visual configurada.
 * Sem itens configurados, renderiza apenas o cabeçalho da seção.
 */
const TestimonialsSection = createSectionDispatcher(VARIANTS);

export default TestimonialsSection;
