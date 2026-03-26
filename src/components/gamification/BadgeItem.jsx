import React from 'react';
import { Award } from 'lucide-react';

export default function BadgeItem({ badge, isPinned, onPin, isOwner, isEarned }) {
  return (
    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center bg-white/5 border-2 border-white/10 shadow-inner overflow-hidden group">
      
      {/* Apenas imagem real hospedada no Admin */}
      {(badge.image_png_file || badge.image_url) ? (
        <img 
          src={badge.image_png_file || badge.image_url} 
          alt={badge.name} 
          className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-2xl z-10"
          onError={(e) => {
            console.error("❌ Falha no emblema hospedado:", badge.name);
            e.target.style.opacity = '0'; // Se falhar, fica invisível em vez de mostrar erro
          }}
        />
      ) : (
        /* Se não houver imagem na BD, mostra um placeholder elegante de Admin */
        <div className="bg-slate-800 w-full h-full flex items-center justify-center">
          <Award className="text-slate-600 opacity-20" size={24} />
        </div>
      )}
      
      {/* Brilho de Vidro Premium */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50 pointer-events-none" />

      {/* Pin Button (opcional) */}
      {isOwner && isEarned && onPin && (
        <button
          onClick={onPin}
          className={`absolute -top-1 -right-1 p-1 rounded-full transition-all z-20 ${
            isPinned 
              ? 'bg-yellow-400 text-white scale-110 shadow-md' 
              : 'bg-gray-400 text-gray-600 opacity-0 group-hover:opacity-100'
          }`}
          title={isPinned ? "Desafixar" : "Fixar"}
        >
          <span className="text-xs font-black">📌</span>
        </button>
      )}
    </div>
  );
}