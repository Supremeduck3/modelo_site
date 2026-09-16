import GalleryCarousel from './GalleryCarousel';
import GalleryGrid from './GalleryGrid';
import GalleryMasonry from './GalleryMasonry';

const VARIANTS = {
  grid: GalleryGrid,
  masonry: GalleryMasonry,
  carousel: GalleryCarousel,
};

/** Seção "Galeria": despacha para a variante visual configurada. */
export default function GallerySection({ id, variant, content = {} }) {
  const Variant = VARIANTS[variant] ?? GalleryGrid;

  return <Variant id={id} content={content} />;
}
