import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SearchStatus({ onCancel }) {
  const [dots, setDots] = useState("");
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 max-w-md mx-auto relative overflow-hidden">
      {/* Radar Animation */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-8">
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-60" style={{ animationDuration: '2s' }}></div>
        <div className="absolute inset-4 bg-blue-200 rounded-full animate-ping opacity-60" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
        <div className="absolute inset-8 bg-blue-300 rounded-full animate-ping opacity-60" style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
        <div className="relative z-10 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
          <Search className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">A procurar Dog Walkers{dots}</h2>
      <p className="text-gray-500 text-center mb-6">A notificar profissionais num raio de 5km.</p>
      
      <div className="bg-gray-100 px-4 py-2 rounded-full font-mono text-gray-700 font-medium tracking-widest mb-8">
        {formatTime(seconds)}
      </div>

      <Button 
        variant="outline" 
        className="w-full max-w-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-12 rounded-xl font-semibold transition-colors"
        onClick={onCancel}
      >
        Cancelar Pedido
      </Button>
    </div>
  );
}