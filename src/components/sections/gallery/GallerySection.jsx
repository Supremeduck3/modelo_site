import { createSectionDispatcher } from '../dispatchSection';
import GalleryCarousel from './GalleryCarousel';
import GalleryGrid from './GalleryGrid';
import GalleryMasonry from './GalleryMasonry';

const VARIANTS = {
  grid: GalleryGrid,
  masonry: GalleryMasonry,
  carousel: GalleryCarousel,
};

/**
 * Seção "Galeria": despacha para a variante visual configurada.
 * Sem itens configurados, renderiza apenas o cabeçalho da seção.
 */
const GallerySection = createSectionDispatcher(VARIANTS);

export default GallerySection;
