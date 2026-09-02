import MediaLightbox from "@/components/ui/MediaLightbox";

/**
 * PortfolioLightbox — mantém a interface antiga (items, initialIndex, onClose)
 * e delega no MediaLightbox (portal, pinch-to-zoom, swipe, vídeos).
 */
export default function PortfolioLightbox({ items, initialIndex, onClose }) {
  return <MediaLightbox items={items} initialIndex={initialIndex} onClose={onClose} />;
}