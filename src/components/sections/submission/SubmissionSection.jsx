import SubmissionCta from './SubmissionCta';
import SubmissionEmbedded from './SubmissionEmbedded';

/** Despacha a seção do canal de manifestações para a variante configurada. */
const VARIANTS = {
  cta: SubmissionCta,
  embedded: SubmissionEmbedded,
};

export default function SubmissionSection({ id, variant, content }) {
  const Variant = VARIANTS[variant] ?? SubmissionCta;
  return <Variant id={id} content={content} />;
}
