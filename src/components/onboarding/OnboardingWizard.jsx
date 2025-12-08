import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";

export default function OnboardingWizard({ steps = [], onComplete, tutorialId = "main_tutorial" }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState(null);
    const [isClient, setIsClient] = useState(false);

    // Pixel Art Dog Placeholder
    const MASCOT_URL = "https://placehold.co/100x100/purple/white?text=DOG&font=roboto"; 

    useEffect(() => {
        setIsClient(true);
        const hasSeen = localStorage.getItem(`hasSeenTutorial_${tutorialId}`);
        if (!hasSeen && steps.length > 0) {
            // Small delay to ensure DOM is ready
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, [tutorialId, steps.length]);

    useEffect(() => {
        if (!isVisible || !steps[currentStep]) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            const element = document.querySelector(step.target);
            
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                    bottom: rect.bottom,
                    right: rect.right
                });
                
                // Scroll element into view with padding
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // If element not found, fallback to center or skip
                setTargetRect({
                    top: window.innerHeight / 2 - 100,
                    left: window.innerWidth / 2 - 150,
                    width: 300,
                    height: 200
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStep, isVisible, steps]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = async () => {
        setIsVisible(false);
        localStorage.setItem(`hasSeenTutorial_${tutorialId}`, 'true');
        
        // Optional: Sync with backend if user is logged in
        try {
            const user = await base44.auth.me();
            if (user) {
                // Assuming we might store this in a generic preferences field or similar
                // For now, local storage is the primary driver as requested
            }
        } catch (e) {
            // Ignore auth errors
        }

        if (onComplete) onComplete();
    };

    if (!isClient || !isVisible || !targetRect) return null;

    const currentStepData = steps[currentStep];

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Spotlight Overlay using massive box-shadow trick */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none border-2 border-white/50 rounded-lg transition-all duration-300 ease-in-out"
                        style={{
                            top: targetRect.top - 10, // Padding
                            left: targetRect.left - 10,
                            width: targetRect.width + 20,
                            height: targetRect.height + 20,
                        }}
                    />

                    {/* Mascot & Bubble Container */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={currentStep}
                        className="absolute flex items-start gap-4 transition-all duration-300"
                        style={{
                            // Smart positioning: if target is low, show above, else below
                            top: targetRect.top > window.innerHeight / 2 
                                ? targetRect.top - 220 
                                : targetRect.top + targetRect.height + 30,
                            left: Math.max(20, Math.min(window.innerWidth - 340, targetRect.left)),
                            maxWidth: '320px',
                            zIndex: 101
                        }}
                    >
                        {/* Pixel Art Mascot */}
                        <div className="flex-shrink-0 relative hidden md:block">
                            <img 
                                src={MASCOT_URL} 
                                alt="Mascot" 
                                className="w-16 h-16 object-contain drop-shadow-lg pixelated"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </div>

                        {/* RPG Speech Bubble */}
                        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] p-4 relative rounded-sm font-mono">
                            {/* Speech Triangle */}
                            <div 
                                className="absolute w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black -top-3 left-4 md:-left-3 md:top-4 md:rotate-[-90deg]"
                            />
                            
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg leading-tight text-purple-700">
                                    {currentStepData.title}
                                </h3>
                                <button onClick={handleComplete} className="text-gray-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                                {currentStepData.content}
                            </p>

                            {/* Controls */}
                            <div className="flex justify-between items-center mt-2 border-t-2 border-gray-100 pt-2">
                                <span className="text-xs font-bold text-gray-400">
                                    {currentStep + 1} / {steps.length}
                                </span>
                                
                                <div className="flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={handlePrev}
                                        disabled={currentStep === 0}
                                        className="h-8 px-2"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    
                                    <Button 
                                        size="sm" 
                                        className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-bold border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all"
                                        onClick={handleNext}
                                    >
                                        {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                                        {currentStep !== steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                                    </Button>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleComplete}
                                className="text-[10px] text-gray-400 mt-2 hover:text-gray-600 underline w-full text-center block"
                            >
                                Pular Tutorial
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}