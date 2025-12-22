import React from "react";
import { Dog, Cat, Bug, Bird } from "lucide-react";

// Ícone SVG customizado para répteis (cobra)
const ReptileIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 5.5c-3 0-5.5 1.2-5.5 2.5v3c0 1.3 2.5 2.5 5.5 2.5s5.5-1.2 5.5-2.5v-3c0-1.3-2.5-2.5-5.5-2.5z"/>
    <path d="M6.5 11v3c0 1.3 2.5 2.5 5.5 2.5s5.5-1.2 5.5-2.5v-3"/>
    <ellipse cx="12" cy="8" rx="5.5" ry="2.5"/>
  </svg>
);

// Ícone SVG customizado para aracnídeos (aranha minimalista)
const ArachnidIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 9V6m0 12v-3M9 12H6m12 0h-3"/>
    <path d="M14.5 14.5l2 2m-9-9l2 2m5 0l2-2m-9 9l2-2"/>
  </svg>
);

// Ícone SVG customizado para roedores (rato minimalista)
const RodentIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="14" cy="12" r="6"/>
    <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
    <path d="M8 12c-2 0-3.5-1-4-2"/>
    <circle cx="6" cy="8" r="3"/>
  </svg>
);

export const animalConfig = {
  dogs: {
    label: { pt: 'Cães', en: 'Dogs', es: 'Perros' },
    Icon: Dog,
    color: 'text-gray-700'
  },
  cats: {
    label: { pt: 'Gatos', en: 'Cats', es: 'Gatos' },
    Icon: Cat,
    color: 'text-gray-700'
  },
  reptiles: {
    label: { pt: 'Répteis', en: 'Reptiles', es: 'Reptiles' },
    Icon: ReptileIcon,
    color: 'text-gray-700'
  },
  arachnids: {
    label: { pt: 'Aracnídeos', en: 'Arachnids', es: 'Arácnidos' },
    Icon: ArachnidIcon,
    color: 'text-gray-700'
  },
  rodents: {
    label: { pt: 'Roedores', en: 'Rodents', es: 'Roedores' },
    Icon: RodentIcon,
    color: 'text-gray-700'
  },
  birds: {
    label: { pt: 'Aves', en: 'Birds', es: 'Aves' },
    Icon: Bird,
    color: 'text-gray-700'
  }
};

export const AnimalIconsList = ({ acceptedAnimals = ['dogs'], language = 'pt', size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {acceptedAnimals.map(animal => {
        const config = animalConfig[animal];
        if (!config) return null;
        const Icon = config.Icon;
        
        return (
          <div key={animal} className="flex items-center gap-1">
            <Icon className={`${sizeClass} ${config.color}`} />
          </div>
        );
      })}
    </div>
  );
};

export const AnimalIconsWithLabels = ({ acceptedAnimals = ['dogs'], language = 'pt' }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {acceptedAnimals.map(animal => {
        const config = animalConfig[animal];
        if (!config) return null;
        const Icon = config.Icon;
        
        return (
          <div key={animal} className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <span className="text-xs text-gray-600 font-medium">{config.label[language]}</span>
          </div>
        );
      })}
    </div>
  );
};