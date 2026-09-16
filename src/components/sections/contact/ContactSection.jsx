import ContactCards from './ContactCards';
import ContactFormSplit from './ContactFormSplit';
import ContactMap from './ContactMap';

/** Despacha a seção de contato para a variante escolhida na configuração. */
const VARIANTS = {
  cards: ContactCards,
  map: ContactMap,
  'form-split': ContactFormSplit,
};

export default function ContactSection({ id, variant, content }) {
  const Variant = VARIANTS[variant] ?? ContactCards;
  return <Variant id={id} content={content} />;
}
