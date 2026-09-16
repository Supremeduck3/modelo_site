import TestimonialsCards from './TestimonialsCards';
import TestimonialsSingle from './TestimonialsSingle';
import TestimonialsSlider from './TestimonialsSlider';

const VARIANTS = {
  cards: TestimonialsCards,
  slider: TestimonialsSlider,
  single: TestimonialsSingle,
};

/** Seção "Depoimentos": despacha para a variante visual configurada. */
export default function TestimonialsSection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? TestimonialsCards;

  return <Variant id={id} content={content} />;
}
