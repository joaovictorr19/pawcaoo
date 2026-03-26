import { Button } from "@/components/ui/button";

export default function ServiceCard({ title, price, desc, promo, icon, onClick }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h3 className="font-black text-slate-900">{title}</h3>
            {price && <p className="text-xs text-slate-500">€{price}/hora</p>}
          </div>
        </div>
        {price && <p className="text-xl font-black text-slate-900">€{price}</p>}
      </div>
      
      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{desc}</p>
      
      {promo && (
        <p className="text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-2 rounded-lg mb-3 inline-block">
          {promo}
        </p>
      )}
      
      <Button 
        onClick={onClick}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-11"
      >
        Ver Detalhes
      </Button>
    </div>
  );
}