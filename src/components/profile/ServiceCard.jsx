import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function ServiceCard({ title, price, desc, promo, icon, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-white/70 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/50 shadow-xl shadow-slate-200/40 active:scale-95 transition-all cursor-pointer hover:bg-white/80 mb-4"
    >
      <div className="flex justify-between items-start">
        <div className="bg-orange-50 p-4 rounded-2xl text-orange-500">
          {icon}
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A partir de</span>
          <p className="text-2xl font-black text-slate-900 leading-none">{price}€</p>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{title}</h3>
        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{desc}</p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[9px] font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full italic">
          {promo}
        </span>
        <div className="flex items-center gap-1 text-[10px] font-black text-slate-900 uppercase tracking-tighter">
          Reservar <ArrowRight size={12} />
        </div>
      </div>
    </div>
  );
}