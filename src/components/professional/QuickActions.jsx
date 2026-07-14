import React from "react";
import { Button } from "@/components/ui/button";
import { Edit, Calendar, Plus, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function QuickActions({ onAddService }) {
  const navigate = useNavigate();

  const actions = [
    { label: "Editar Perfil", icon: Edit, onClick: () => navigate(createPageUrl('EditWalkerProfile')), style: "bg-gray-900 text-white hover:bg-gray-800" },
    { label: "Agenda", icon: Calendar, onClick: () => navigate(createPageUrl("ProfessionalCalendar")), style: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" },
    { label: "Serviço", icon: Plus, onClick: onAddService, style: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" },
    { label: "Fiscal", icon: FileText, onClick: () => navigate(createPageUrl('FiscalSettings')), style: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50" },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {actions.map((action, idx) => (
        <Button
          key={idx}
          onClick={action.onClick}
          className={`h-9 px-3 text-xs font-medium rounded-lg shrink-0 shadow-sm ${action.style}`}
          size="sm"
        >
          <action.icon className="w-3.5 h-3.5 mr-1.5" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}