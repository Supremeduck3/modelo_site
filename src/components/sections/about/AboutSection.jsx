import AboutImageText from './AboutImageText';
import AboutSimple from './AboutSimple';
import AboutStats from './AboutStats';

const VARIANTS = {
  simple: AboutSimple,
  'image-text': AboutImageText,
  stats: AboutStats,
};

/** Seção "Sobre": despacha para a variante visual configurada. */
export default function AboutSection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? AboutSimple;

  return <Variant id={id} content={content} />;
}
