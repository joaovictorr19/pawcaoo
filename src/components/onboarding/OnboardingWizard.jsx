import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { X, SkipForward } from "lucide-react";

// Nome da chave para gravar no navegador (Reset para versão Final)
const TUTORIAL_KEY = 'pawcao_tutorial_completed_final';

export default function OnboardingWizard({ steps }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [show, setShow] = useState(false);

  // 1. Verifica se já viu ao carregar a página (Check Estrito)
  useEffect(() => {
    const hasSeen = localStorage.getItem(TUTORIAL_KEY);
    
    // Só mostra se NÃO tiver a chave gravada (null ou undefined)
    if (hasSeen === null) {
      // Pequeno delay para garantir que o site carregou visualmente
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // 2. Função que encerra o tutorial permanentemente
  const finishTutorial = () => {
    try {
        localStorage.setItem(TUTORIAL_KEY, 'true'); // Grava a chave
    } catch (e) {
        console.error("Erro ao salvar no localStorage", e);
    }
    setShow(false);
  };

  const handleNext = () => {
    if (currentStepIndex >= steps.length - 1) {
      finishTutorial();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const updatePosition = useCallback(() => {
    if (!show) return;
    
    const step = steps[currentStepIndex];
    if (!step) return;

    const element = document.querySelector(step.targetId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = element.getBoundingClientRect();
      
      setTargetRect({
        top: rect.top - 5,
        left: rect.left - 5,
        width: rect.width + 10,
        height: rect.height + 10,
        position: rect.top > 200 ? 'top' : 'bottom'
      });
    } else {
      // Se não achar o elemento, tenta o próximo passo automaticamente
      // para não travar o tutorial
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      } else {
        finishTutorial();
      }
    }
  }, [currentStepIndex, show, steps]);

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
      {/* Overlay Escuro com Recorte */}
      <div 
        className="fixed z-[9998] transition-all duration-300 ease-out pointer-events-none border-2 border-white/50 rounded-lg"
        style={{
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)' 
        }}
      />

      {/* Balão do Mascote */}
      <div 
        className="fixed z-[9999] transition-all duration-300 flex flex-col items-center"
        style={{
          // Ancoragem Dinâmica (Mobile Force Bottom)
          ...(window.innerWidth >= 768 ? {
            // Desktop: Relativo ao elemento
            top: targetRect.position === 'bottom' ? targetRect.top + targetRect.height + 20 : 'auto',
            bottom: targetRect.position === 'top' ? (window.innerHeight - targetRect.top) + 20 : 'auto',
            left: targetRect.left + (targetRect.width / 2) - 150,
            width: '300px'
          } : {
            // Mobile: Fixo em baixo (Anti-Clipping)
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90vw',
            maxWidth: '400px',
            top: 'auto' // Força reset do top
          })
        }}
      >
        {/* Seta do Balão (Apenas Desktop) */}
        <div className="hidden md:block w-4 h-4 bg-white transform rotate-45 absolute -top-2 left-1/2 -translate-x-1/2" />

        <div className="bg-white rounded-xl p-4 shadow-2xl border-2 border-purple-500 relative w-full animate-in slide-in-from-bottom-5 duration-500">
          
          {/* Botão Fechar (X) - Também marca como visto! */}
          <button 
            onClick={finishTutorial} 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
            title="Fechar Tutorial"
          >
            <X size={16} />
          </button>
          
          <div className="flex gap-3 md:gap-4">
            {/* Mascote */}
            <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-100 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl border-2 border-purple-200">
             🐶
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-base md:text-lg text-purple-700 mb-1">{currentStep.title}</h3>
              <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {currentStep.content}
              </p>
              
              <div className="flex justify-between items-center mt-2">
                {/* Botão Pular */}
                <button 
                  onClick={finishTutorial}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <SkipForward size={12} /> Pular
                </button>

                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-mono">
                    {currentStepIndex + 1}/{steps.length}
                    </span>
                    <Button 
                    size="sm" 
                    onClick={handleNext} 
                    className="bg-purple-600 hover:bg-purple-700 h-8 px-4"
                    >
                    {currentStepIndex === steps.length - 1 ? 'Concluir' : 'Próximo'}
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}