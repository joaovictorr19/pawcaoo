import React from 'react';

/**
 * Map component stubs para evitar erros de importação
 * Componentes de mapa foram removidos
 */

export function Marker({ children, longitude, latitude }) {
  return <>{children}</>;
}

export function Source({ children, id, type, data }) {
  return <>{children}</>;
}

export function Layer({ id, type, paint }) {
  return null;
}

export function Popup({ children, offset, closeButton }) {
  return <div className="absolute bg-white rounded shadow-lg p-2 text-xs">{children}</div>;
}