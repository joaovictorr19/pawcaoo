import React from 'react';
import { Card } from "@/components/ui/card";
import { Gift, Calendar, User, ArrowUpRight } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export function AdminVoucherHistory({ historyLogs }) {
  return (
    <div className="space-y-4 mt-8 pb-10">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Registo de Ofertas Realizadas
        </h3>
        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
          Total: {historyLogs?.length || 0}
        </span>
      </div>

      <div className="space-y-3">
        {historyLogs?.map((log) => (
          <Card key={log.id} className="p-4 bg-white border-slate-100 rounded-[2rem] shadow-sm flex items-center justify-between border-l-4 border-l-orange-500">
            <div className="flex items-center gap-4">
              {/* Avatar do Cliente que recebeu */}
              <div className="relative">
                <img 
                  src={log.target_user_photo || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=100"} 
                  className="w-10 h-10 rounded-2xl object-cover" 
                  alt="Cliente"
                />
                <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full p-1 border-2 border-white">
                  <Gift size={8} className="text-white" />
                </div>
              </div>

              <div>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {log.target_user_name || 'Utilizador'}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1">
                  <Calendar size={10} />
                  <span>
                    {log.created_date ? format(new Date(log.created_date), "dd 'de' MMMM", { locale: pt }) : 'Recente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-black text-slate-300 uppercase">Motivo</p>
              <p className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg mt-1">
                {log.reason || "Cortesia Admin"}
              </p>
            </div>
          </Card>
        ))}

        {(!historyLogs || historyLogs.length === 0) && (
          <div className="text-center py-10 opacity-30">
            <Gift size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-400">Nenhuma oferta registada ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}