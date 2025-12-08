import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function OnboardingWizard({ steps, onComplete }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [show, setShow] = useState(false);

  // Verifica se já viu o tutorial
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial_v1');
    if (!hasSeen) {
      // Pequeno delay para garantir que o site carregou
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const handleNext = () => {
    if (currentStepIndex >= steps.length - 1) {
      finishTutorial();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const finishTutorial = () => {
    localStorage.setItem('hasSeenTutorial_v1', 'true');
    setShow(false);
    if (onComplete) onComplete();
  };

  const updatePosition = useCallback(() => {
    if (!show) return;
    
    const step = steps[currentStepIndex];
    // Support both target (from layout.js) and targetId (from user request)
    const selector = step.target || step.targetId;
    const element = document.querySelector(selector);

    if (element) {
      // Rola até o elemento suavemente
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Pega as coordenadas exatas
      const rect = element.getBoundingClientRect();
      
      // Adiciona um padding (respiro) de 5px
      setTargetRect({
        top: rect.top - 5,
        left: rect.left - 5,
        width: rect.width + 10,
        height: rect.height + 10,
        // Decide se o balão fica em cima ou em baixo
        position: rect.top > 200 ? 'top' : 'bottom'
      });
    } else {
      // Se o elemento não existir (ex: escondido no mobile), pula o passo
      // Mas cuidado com loops infinitos
      console.warn(`Elemento ${selector} não encontrado.`);
    }
  }, [currentStepIndex, show, steps]);

  // Atualiza posição ao mudar de passo ou redimensionar janela
  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [updatePosition]);

  if (!show || !targetRect) return null;

  const currentStep = steps[currentStepIndex];

  return (
    <>
      {/* 1. O Recorte Escuro (Spotlight) */}
      <div 
        className="fixed z-[100] transition-all duration-300 ease-out pointer-events-none border-2 border-white/50 rounded-lg box-shadow-overlay"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          // Este shadow cria o fundo escuro em volta do buraco
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)' 
        }}
      />

      {/* 2. O Balão de Fala e o Mascote (Versão Responsiva Corrigida) */}
      <div 
        className="fixed z-[101] transition-all duration-300 flex flex-col items-center"
        style={{
          // Lógica Desktop (Mantém a original)
          ...(window.innerWidth >= 768 ? {
            top: targetRect.position === 'bottom' ? targetRect.top + targetRect.height + 20 : 'auto',
            bottom: targetRect.position === 'top' ? (window.innerHeight - targetRect.top) + 20 : 'auto',
            left: targetRect.left + (targetRect.width / 2) - 150,
          } : {
            // Lógica Mobile (FORÇA CENTRO DA TELA EM BAIXO)
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)', // Garante centralização perfeita
            width: '90%', // Ocupa 90% da largura da tela
            maxWidth: '400px'
          })
        }}
      >
        {/* Seta do Balão (Só mostra no Desktop) */}
        <div className="hidden md:block w-4 h-4 bg-white transform rotate-45 absolute -top-2 left-1/2 -translate-x-1/2" />

        {/* Conteúdo do Card */}
        <div className="bg-white rounded-xl p-4 shadow-2xl border-2 border-purple-500 w-full relative animate-in fade-in zoom-in duration-300">
          <button onClick={finishTutorial} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
          
          <div className="flex gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl border-2 border-purple-200">
                  🐶
              </div>
              <div className="flex-1">
                  <h3 className="font-bold text-lg text-purple-700 mb-1">{currentStep.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{currentStep.content}</p>
                  <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{currentStepIndex + 1}/{steps.length}</span>
                      <Button size="sm" onClick={handleNext} className="bg-purple-600 hover:bg-purple-700 text-white">
                          {currentStepIndex === steps.length - 1 ? 'Fim' : 'Próximo'}
                      </Button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}