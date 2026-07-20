import React from "react";

/**
 * PawCão logo icon — circular teal button with a white dog silhouette
 * and three paw-print pads. Inspired by the reference design.
 * Pure SVG so it stays crisp at every size.
 */
export default function PawCaoLogoIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="PawCão"
    >
      <defs>
        <radialGradient id="pawcaoLogoGrad" cx="38%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#5a908d" />
          <stop offset="55%" stopColor="#437976" />
          <stop offset="100%" stopColor="#355f5d" />
        </radialGradient>
      </defs>

      {/* Circular button background */}
      <circle cx="32" cy="32" r="32" fill="url(#pawcaoLogoGrad)" />

      {/* subtle 3D shading — darker crescent at bottom/right */}
      <path
        d="M32 64A32 32 0 0 0 32 0a32 32 0 0 0 0 64Z"
        fill="#2c4f4d"
        opacity="0.18"
        transform="translate(1.5 1.5)"
        clipPath="circle(31px at 33 31)"
      />

      {/* White graphic — dog silhouette (facing left) + three paw pads */}
      <g fill="#ffffff">
        {/* Dog body */}
        <path d="M23 44c0-7 4-12 11-12 5 0 8 3 8 8 0 6-4 10-10 10-2 0-4 0-5-1l-2 3c-1 1-3 1-4 0-1-2 0-4 1-5l1-2c0 0-1-1-1-3Z" />
        {/* Dog head */}
        <path d="M14 32c0-5 3-9 8-9 4 0 7 3 7 7 0 3-2 6-5 7l1 4c0 1-1 2-2 1l-3-2c-1 0-2 0-3-1-2-1-3-4-3-7Z" />
        {/* Ear */}
        <path d="M20 24c-1-3 0-6 2-7 2 0 3 2 3 4 0 2-1 4-3 4Z" opacity="0.92" />
        {/* Snout / nose tip */}
        <circle cx="13" cy="31" r="1.6" />

        {/* Paw-print pads (top-right of the dog) */}
        <ellipse cx="43" cy="22" rx="4.2" ry="5.2" />
        <ellipse cx="51" cy="27" rx="3.6" ry="4.6" />
        <ellipse cx="42" cy="30" rx="3.4" ry="4.2" />
      </g>
    </svg>
  );
}