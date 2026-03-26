import React from 'react';
import { Check, X, Eye, FileText, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminProfessionalReview({ pendingPros = [], onApprove, onReject, isLoading = false }) {
  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-16 px-4 md:px-6 bg-transparent min-h-screen pt-4 md:pt-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
          Candidatos <span className="text-orange-500">Pendentes</span>
        </h1>
        <p className="text-xs md:text-sm font-medium text-slate-500">
          {pendingPros.length} {pendingPros.length === 1 ? 'profissional aguarda' : 'profissionais aguardam'} aprovação
        </p>
      </div>

      {pendingPros.length > 0 ? (
        <div className="space-y-4 md:space-y-5">
          {pendingPros.map((pro) => (
            <div 
              key={pro.id} 
              className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-md border border-slate-100 hover:shadow-lg transition-shadow"
            >
              {/* Header: Photo and Name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-100 overflow-hidden border-2 border-orange-100 flex-shrink-0">
                  {pro.photo_url ? (
                    <img 
                      src={pro.photo_url} 
                      alt={pro.walker_name || pro.trainer_name}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-slate-100">
                      <span className="text-xs font-black text-orange-300">No photo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-black text-slate-900 uppercase text-xs md:text-sm tracking-wider truncate">
                    {pro.walker_name || pro.trainer_name || 'N/A'}
                  </h2>
                  <div className="flex items-center text-xs text-slate-500 mt-1 gap-1">
                    <MapPin size={12} className="flex-shrink-0" /> 
                    <span className="truncate">{pro.location || "Localização não definida"}</span>
                  </div>
                  <div className="text-xs text-orange-600 font-semibold mt-1">
                    €{pro.hourly_rate?.toFixed(2) || '0.00'}/hora
                  </div>
                </div>
              </div>

              {/* Services Grid */}
              {pro.services_offered && pro.services_offered.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {pro.services_offered.map((service, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-50 p-3 rounded-xl border border-slate-100"
                    >
                      <p className="text-xs font-black text-slate-400 uppercase leading-tight mb-1 line-clamp-1">
                        {service.service_name || `Serviço ${idx + 1}`}
                      </p>
                      <p className="text-xs font-bold text-slate-900">
                        €{service.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Info Buttons */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 md:h-11 rounded-xl text-xs md:text-sm font-bold"
                  disabled={isLoading}
                >
                  <FileText size={14} className="mr-1.5 flex-shrink-0" /> Docs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-10 md:h-11 rounded-xl text-xs md:text-sm font-bold"
                  disabled={isLoading}
                >
                  <Eye size={14} className="mr-1.5 flex-shrink-0" /> Perfil
                </Button>
              </div>

              {/* Approval/Rejection Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => onReject(pro.id)}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1 h-12 md:h-13 rounded-2xl font-black uppercase text-xs md:text-sm flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <X size={16} className="flex-shrink-0" />
                      Recusar
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => onApprove(pro.id)}
                  disabled={isLoading}
                  className="flex-[1.5] h-12 md:h-13 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/30"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <Check size={16} className="flex-shrink-0" />
                      Aprovar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 md:py-32">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-slate-300" size={32} />
          </div>
          <p className="text-sm md:text-base font-black text-slate-400 uppercase tracking-wider">
            Tudo em dia, Admin!
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Nenhum profissional pendente no momento
          </p>
        </div>
      )}
    </div>
  );
}