import React from 'react';
import { OnlineWalkersRibbon } from './OnlineWalkersRibbon';

export default function UserDashboard({ user, allWalkers, emergencyWalks }) {
  
  // 1. Filtramos quem está online para o Carrossel
  const onlineWalkers = allWalkers?.filter(w => w.is_online) || [];

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 animate-in fade-in duration-500">
      
      {/* SEÇÃO: QUEM ESTÁ ONLINE AGORA (Os rostos que sumiram) */}
      <section className="mb-8">
        <OnlineWalkersRibbon walkers={onlineWalkers} />
      </section>

      {/* SEÇÃO: STATUS DA PAWGO (Radar ou Serviço Ativo) */}
      <section className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md rounded-[3rem] shadow-2xl p-6 border border-white/50">
        {emergencyWalks && emergencyWalks.length > 0 ? (
          /* Se houver um passeio a acontecer, mostra os detalhes */
          <div className="text-center py-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Passeios Disponíveis Agora</h2>
            <p className="text-sm text-slate-600 mb-6">Encontra profissionais para passeios imediatos</p>
            <div className="space-y-3">
              {emergencyWalks.slice(0, 3).map((walk) => (
                <div key={walk.id} className="p-4 bg-orange-50 rounded-2xl border border-orange-200">
                  <p className="font-bold text-slate-900">{walk.owner_name}</p>
                  <p className="text-xs text-slate-600">{walk.location}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Se não, mostra o botão de Pedir */
          <div className="text-center py-10">
            <h2 className="text-2xl font-black text-slate-900 mb-2 italic">Pronto para passear?</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
              Encontra o parceiro ideal para o teu cão
            </p>
            
            {/* O BOTÃO QUE ABRE O MAPA E CHAMA O "ESTILO UBER" */}
            <button className="w-full h-20 bg-orange-500 rounded-[2rem] text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 active:scale-95 transition-transform hover:bg-orange-600">
              Pedir Passeio Imediato
            </button>
          </div>
        )}
      </section>

      {/* HISTÓRICO OU AGENDAMENTOS (espaço para conteúdo futuro) */}
      <div className="mt-8">
        {/* Conteúdo adicional aqui */}
      </div>
    </div>
  );
}