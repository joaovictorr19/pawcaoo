import React from 'react';
import { Dog, Briefcase, MapPin, Zap, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingHome({ onLogin, onRegisterPro }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center pt-20 pb-32 px-6">
      {/* 1. HERO SECTION: O IMPACTO */}
      <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9] mb-6">
          Passeios Reais,<br/>
          <span className="text-orange-500 italic">Cães Felizes.</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">
          A maior e mais segura rede de Dog Walkers de Portugal
        </p>
      </div>

      {/* 2. OS DOIS CAMINHOS (TUTOR VS PRO) */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
        
        {/* CARD DO TUTOR (BRANCO/VIDRO) */}
        <div className="group relative bg-white/70 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl border border-white/50 transition-all hover:-translate-y-2">
          <div className="relative z-10 text-left">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-200">
              <MapPin size={28} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 leading-tight">Preciso de um Passeador</h2>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
              Encontre profissionais verificados agora mesmo para passear o seu melhor amigo.
            </p>
            <Button 
              onClick={onLogin} 
              className="w-full bg-slate-900 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px]"
            >
              Encontrar Profissional
            </Button>
          </div>
          <Dog size={140} weight="fill" className="absolute -bottom-6 -right-6 text-orange-500/5 group-hover:text-orange-500/10 transition-colors" />
        </div>

        {/* CARD DO PROFISSIONAL (PRETO/MODERNO) */}
        <div className="group relative bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800 transition-all hover:-translate-y-2">
          <div className="relative z-10 text-left">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-6">
              <Zap size={28} className="text-orange-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 leading-tight">Quero ser Profissional</h2>
            <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              Ganhe dinheiro extra e tenha flexibilidade total a passear cães na sua cidade.
            </p>
            <Button 
              onClick={onRegisterPro} 
              className="w-full bg-orange-500 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-orange-500/20"
            >
              Fazer Registo Profissional
            </Button>
          </div>
          <Briefcase size={140} className="absolute -bottom-6 -right-6 text-white/5 group-hover:text-white/10 transition-colors" />
        </div>

      </div>

      {/* 3. TRUST BAR (PROVAS SOCIAIS) */}
      <div className="mt-20 flex flex-wrap justify-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">Pagamento Seguro</span>
        </div>
        <div className="flex items-center gap-2">
          <Star size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest italic">Apoio 24/7</span>
        </div>
      </div>
    </div>
  );
}

export default LandingHome;