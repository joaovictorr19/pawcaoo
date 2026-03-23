import { Dog, Clock, ChevronRight, MoreVertical } from "lucide-react";

export function ServiceCard({ service }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl group active:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
          {service.type === 'walk' ? <Dog className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 leading-tight">{service.name}</h4>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            {service.duration || "Tempo Variável"} • {service.animal_type || "Cães"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="block text-lg font-black text-slate-900">{service.price}€</span>
        </div>
        <button className="p-2 text-slate-300 hover:text-slate-600">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}