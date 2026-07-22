export function OnlineWalkersRibbon({ walkers }) {
  const onlineOnly = walkers.filter(w => w.is_online || w.pawgo_status?.is_online);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between px-4 mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          Dog Walkers Online Agora
        </h3>
        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
        {onlineOnly.length === 0 ? (
          <p className="text-[10px] font-medium text-slate-400 italic">Nenhum Dog Walker online na tua zona...</p>
        ) : (
          onlineOnly.map((pro) => (
            <div key={pro.id} className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative">
                <div className="w-16 h-16 rounded-[2rem] border-2 border-orange-500 p-0.5 bg-white">
                  {(pro.photo_url || pro.professional_profile?.avatar_url) ? (
                    <img
                      src={pro.photo_url || pro.professional_profile?.avatar_url}
                      className="w-full h-full object-cover rounded-[1.7rem]"
                      alt={pro.walker_name || pro.full_name}
                    />
                  ) : (
                    <div className="w-full h-full rounded-[1.7rem] bg-orange-100 flex items-center justify-center text-orange-500 font-black text-lg">
                      {(pro.walker_name || pro.full_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <span className="text-[10px] font-bold text-slate-900">
                {(pro.walker_name || pro.full_name || "Pro").split(' ')[0]}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}