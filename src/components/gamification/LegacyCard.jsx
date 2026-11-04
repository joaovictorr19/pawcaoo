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
import { RARITY_LABEL } from "@/lib/legacyCards";
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

/** Carta completa de uma provação: frente com túnica própria, verso com o progresso. */
export default function LegacyCard({ card, flipped = false, onFlip }) {
  const Sigil = SIGILS[card.sigil] || Star;
  const style = {
    "--t-from": card.tunic.from,
    "--t-via": card.tunic.via,
    "--t-to": card.tunic.to,
    "--t-accent": card.tunic.accent,
  };

  const handleKey = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onFlip?.();
    }
  };

  return (
    <div className="lc-scene mx-auto" style={style}>
      <div
        className="lc-flip"
        data-flipped={flipped}
        data-earned={card.earned}
        data-frame={card.frame}
        role="button"
        tabIndex={0}
        onClick={onFlip}
        onKeyDown={handleKey}
        aria-label={`${card.title}: ${card.earned ? "carta conquistada" : `${card.progress} de ${card.total}`}`}
      >
        {/* FRENTE */}
        <div className="lc-face lc-face--front">
          <div className="lc-skin">
            <div className={`lc-inner lc-orn--${card.ornament}`}>
              <span className="lc-corner lc-corner--tl" />
              <span className="lc-corner lc-corner--tr" />
              <span className="lc-corner lc-corner--bl" />
              <span className="lc-corner lc-corner--br" />

              <div className="lc-top">
                <span className="lc-rarity">{RARITY_LABEL[card.rarity]}</span>
                <span className="lc-points">{card.points} pts</span>
              </div>

              <div className="lc-medallion">
                <Sigil className="h-8 w-8" strokeWidth={1.6} />
              </div>

              <h3 className="lc-title">{card.title}</h3>
              <p className="lc-desc">{card.description}</p>

              <div className="lc-foot">
                {card.earned ? (
                  <span className="lc-seal">Conquistada</span>
                ) : (
                  <>
                    <div className="lc-progress">
                      <span style={{ width: `${card.percent}%` }} />
                    </div>
                    <span className="lc-count">
                      {card.progress}/{card.total}
                    </span>
                  </>
                )}
              </div>

              {!card.earned && (
                <span className="lc-lock" aria-hidden="true">
                  <Lock className="h-3 w-3" />
                </span>
              )}
            </div>

            <div className={`lc-foil lc-foil--${card.foil}`} />
            {card.earned && <div className="lc-shine" aria-hidden="true" />}
          </div>
        </div>

        {/* VERSO */}
        <div className="lc-face lc-face--back">
          <div className="lc-back">
            <div className="lc-back-inner">
              <span className="lc-back-kicker">Provação</span>
              <span className="lc-back-value">
                {card.progress}
                <span className="text-base font-bold opacity-50">/{card.total}</span>
              </span>
              <div className="lc-back-track">
                <span style={{ width: `${card.percent}%` }} />
              </div>
              <p className="lc-back-body">{card.description}</p>
              <span className="lc-back-reward">
                <Sparkles className="h-3 w-3" />
                {card.xp} XP
              </span>
              <span className="lc-back-hint">{card.earned ? "Carta na coleção" : "Clica para fechar"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}