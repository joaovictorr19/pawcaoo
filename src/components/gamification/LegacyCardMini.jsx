import React from "react";
import {
  BedDouble,
  Crown,
  Flame,
  Footprints,
  Gem,
  GraduationCap,
  Heart,
  Lock,
  Moon,
  PawPrint,
  Route,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import "./legacyCards.css";

const SIGILS = {
  Footprints,
  Moon,
  Route,
  Heart,
  ShoppingBag,
  BedDouble,
  GraduationCap,
  Sparkles,
  Flame,
  Crown,
  Gem,
  PawPrint,
};

/** Miniatura de carta usada na estante da coleção. */
export default function LegacyCardMini({ card, onClick }) {
  const Sigil = SIGILS[card.sigil] || Star;
  const style = {
    "--t-from": card.tunic.from,
    "--t-via": card.tunic.via,
    "--t-to": card.tunic.to,
    "--t-accent": card.tunic.accent,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="lc-mini"
      data-earned={card.earned}
      style={style}
      title={`${card.title}${card.earned ? "" : ` · ${card.progress}/${card.total}`}`}
      aria-label={`${card.title}${card.earned ? " (conquistada)" : ` (${card.progress} de ${card.total})`}`}
    >
      <span className="lc-mini-inner">
        {card.earned ? (
          <Sigil className="h-5 w-5" strokeWidth={1.7} />
        ) : (
          <Lock className="h-4 w-4 opacity-70" />
        )}
      </span>
    </button>
  );
}