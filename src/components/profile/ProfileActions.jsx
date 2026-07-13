import React from 'react';
import { Star, Award, PawPrint, Clock, MapPin } from 'lucide-react';

export default function ProfileActions({ walker, currentUser }) {
  const profile = walker;
  const rating = profile?.rating?.toFixed(1) || '—';
  const totalWalks = profile?.total_walks || 0;
  const experienceYears = profile?.experience_years || 0;
  const specialization = profile?.specializations?.[0];
  const location = profile?.location;

  const specializationLabels = {
    puppies: 'Cães filhotes',
    senior_dogs: 'Cães séniores',
    special_needs: 'Necessidades especiais',
    behavioral_issues: 'Problemas comportamentais',
    multiple_dogs: 'Múltiplos cães',
    large_breeds: 'Raças grandes',
    small_breeds: 'Raças pequenas',
    anxious_dogs: 'Cães ansiosos',
    high_energy: 'Alta energia',
  };

  const stats = [
    { icon: Star, label: 'Avaliação', value: rating, color: 'text-amber-400' },
    { icon: PawPrint, label: 'Serviços', value: totalWalks, color: 'text-sky-400' },
    { icon: Clock, label: 'Experiência', value: `${experienceYears}a`, color: 'text-emerald-400' },
  ];

  return (
    <div className="flex flex-col gap-4 py-1">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
          <Award className="w-4 h-4 text-white/80" />
        </div>
        <h4 className="font-black uppercase text-[10px] tracking-widest text-white/60 italic">
          Informação do Profissional
        </h4>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="text-center">
            <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
            <p className="text-xl font-black text-white">{stat.value}</p>
            <p className="text-[9px] font-bold uppercase text-white/40 tracking-wide">{stat.label}</p>
          </div>
        ))}
      </div>

      {specialization && (
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <p className="text-[11px] font-semibold text-white/80">
            {specializationLabels[specialization] || specialization}
          </p>
        </div>
      )}

      {location && (
        <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
          <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <p className="text-[11px] font-semibold text-white/80">{location}</p>
        </div>
      )}
    </div>
  );
}