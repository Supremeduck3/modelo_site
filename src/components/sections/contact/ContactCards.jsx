import Section from '@/components/ui/Section';
import ContactInfo from './ContactInfo';

/** Contatos em cards, sem mapa nem formulário. */
export default function ContactCards({ id, content = {} }) {
  return (
    <Section
      id={id}
      title={content.title}
      subtitle={content.subtitle}
      tone="surface"
    >
      <ContactInfo />
    </Section>
  );
}
