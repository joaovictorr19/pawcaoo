import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Search, ToggleLeft, ToggleRight, RefreshCw, Settings, Star, Building2, Users } from "lucide-react";
import { ensureProfileSlug } from "@/utils/profileSlug";
import AdminProfessionalManageModal from "@/components/admin/AdminProfessionalManageModal";

const TYPE_LABELS = {
  walker: "Dog Walker",
  trainer: "Treinador",
  both: "Dog Walker + Treinador",
  hotel: "Hotel",
};

const VERIFICATION_COLORS = {
  verified: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-orange-100 text-orange-700 border-orange-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  requires_documents: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export default function AdminProfessionalsPanel({ walkers = [], onDelete, onToggleActive, onToggleFeatured, onRefresh }) {
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [manageWalker, setManageWalker] = useState(null);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filtered = walkers
    .filter((w) => {
      const q = search.toLowerCase();
      return (
        !q ||
        w.walker_name?.toLowerCase().includes(q) ||
        w.location?.toLowerCase().includes(q) ||
        w.created_by?.toLowerCase().includes(q) ||
        w.professional_type?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return b.is_featured ? 1 : -1;
      return 0;
    });

  const filteredPros = filtered.filter(w => !['hotel', 'shop'].includes(w.professional_type));
  const filteredHotels = filtered.filter(w => w.professional_type === 'hotel');

  const renderTable = (list) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {list.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm">Nenhum perfil encontrado</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Email / Conta</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Verificação</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Estado</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Destaque</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((w) => (
                <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {w.photo_url ? (
                        <img src={w.photo_url} alt={w.walker_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-base flex-shrink-0">🐾</div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{w.walker_name || w.hotel_details?.hotel_name || w.trainer_name || "Sem nome"}</p>
                        <p className="text-xs text-slate-400">{w.location || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate">
                    {w.created_by || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[w.professional_type] || w.professional_type || "—"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${VERIFICATION_COLORS[w.verification_status] || "bg-slate-100 text-slate-600"}`}>
                      {w.verification_status || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${w.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {w.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${w.is_featured ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-400"}`}>
                      {w.is_featured ? "⭐ Destacado" : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-7 w-7 p-0 rounded-full ${w.is_featured ? "hover:bg-amber-100" : "hover:bg-slate-100"}`}
                        title={w.is_featured ? "Remover destaque" : "Destacar perfil (aparece em primeiro)"}
                        onClick={() => onToggleFeatured?.(w)}
                        disabled={!onToggleFeatured}
                      >
                        <Star className={`w-3.5 h-3.5 ${w.is_featured ? "text-amber-500 fill-amber-400" : "text-slate-400"}`} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 hover:bg-blue-50 rounded-full gap-1 text-blue-600 font-semibold"
                        title="Gerir Perfil"
                        onClick={() => setManageWalker(w)}
                      >
                        <Settings className="w-3.5 h-3.5" /> Gerir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-slate-100 rounded-full"
                        title="Ver Perfil"
                        onClick={() => ensureProfileSlug(w.hotel_details?.hotel_name || w.walker_name, w.created_by, w.professional_type === 'hotel' ? 'hotel' : 'walker').then(link => window.open(link, "_blank"))}
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-orange-100 rounded-full"
                        title={w.is_active ? "Desativar" : "Ativar"}
                        onClick={() => onToggleActive(w)}
                      >
                        {w.is_active
                          ? <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                          : <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-red-100 rounded-full"
                        title="Eliminar Perfil"
                        onClick={() => onDelete(w)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, email, localização..."
            className="pl-9 rounded-xl border-slate-200"
          />
        </div>
        <span className="text-sm text-slate-500 font-medium">{filtered.length} perfis</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="ml-auto gap-2 rounded-xl border-slate-200"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "A carregar..." : "Forçar carregamento"}
        </Button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Users className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">Passeadores e Treinadores</h3>
          <span className="text-xs text-slate-400">({filteredPros.length})</span>
        </div>
        {renderTable(filteredPros)}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">Hotéis Caninos</h3>
          <span className="text-xs text-slate-400">({filteredHotels.length})</span>
        </div>
        {renderTable(filteredHotels)}
      </div>

      <AdminProfessionalManageModal
        walker={manageWalker}
        isOpen={!!manageWalker}
        onClose={() => setManageWalker(null)}
        onToggleActive={onToggleActive}
      />
    </div>
  );
}