import HeroCentered from './HeroCentered';
import HeroCtaFocus from './HeroCtaFocus';
import HeroFullImage from './HeroFullImage';
import HeroSplit from './HeroSplit';

/** Despacha o hero para a variante escolhida na configuração. */
const VARIANTS = {
  'full-image': HeroFullImage,
  split: HeroSplit,
  centered: HeroCentered,
  'cta-focus': HeroCtaFocus,
};

export default function HeroSection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? HeroSplit;
  return <Variant id={id} content={content} />;
}
