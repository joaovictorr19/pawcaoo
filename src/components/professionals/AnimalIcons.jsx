import React from "react";
import { Dog, Cat, Bird } from "lucide-react";

// Ícone SVG customizado para répteis (cobra melhorada)
export const ReptileIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3c-2 0-3.5 1-4.5 2.5C6.5 7 6 9 6 11c0 2 .5 4 2 5.5S11 19 13 19c1.5 0 3-.5 4-1.5" />
    <path d="M17 17.5c1 1 2.5 1.5 4 1.5" />
    <circle cx="9" cy="8" r="1" fill="currentColor" />
    <circle cx="11" cy="8" r="1" fill="currentColor" />
    <path d="M8 6c-.5-1-1-2-1-3" />
    <path d="M12 6c.5-1 1-2 1-3" />
  </svg>
);

// Ícone SVG customizado para aracnídeos (aranha)
export const ArachnidIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8v-4" />
    <path d="M12 16v4" />
    <path d="M16 12h4" />
    <path d="M8 12H4" />
    <path d="M15 9l3-3" />
    <path d="M9 15l-3 3" />
    <path d="M15 15l3 3" />
    <path d="M9 9L6 6" />
  </svg>
);

// Ícone SVG customizado para roedores (hamster/coelho)
export const RodentIcon = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="13" r="5"/>
    <circle cx="10" cy="11" r="1" fill="currentColor"/>
    <circle cx="14" cy="11" r="1" fill="currentColor"/>
    <path d="M12 15v1"/>
    <path d="M9 15l-1 1M15 15l1 1"/>
    <circle cx="7" cy="10" r="2"/>
    <circle cx="17" cy="10" r="2"/>
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