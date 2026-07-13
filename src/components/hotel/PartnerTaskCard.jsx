import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Dog, Droplets, Scissors, Star, CheckCircle2, Clock,
  User, Calendar, Phone, Check
} from "lucide-react";

const SERVICE_META = {
  walk:       { label: "Passeio",      icon: Dog,       color: "teal",   bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-700",    iconColor: "text-teal-500" },
  bathing:    { label: "Banho",        icon: Droplets,  color: "sky",    bg: "bg-sky-50",     border: "border-sky-200",     text: "text-sky-700",     iconColor: "text-sky-500" },
  grooming:   { label: "Grooming",     icon: Scissors,  color: "purple", bg: "bg-purple-50",  border: "border-purple-200",  text: "text-purple-700",  iconColor: "text-purple-500" },
  training:   { label: "Treino",       icon: Star,      color: "amber",  bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   iconColor: "text-amber-500" },
  nail_trim:  { label: "Corte Unhas",  icon: Scissors,  color: "rose",   bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    iconColor: "text-rose-500" },
};

export default function PartnerTaskCard({ task, onComplete }) {
  const meta = SERVICE_META[task.service_name] || SERVICE_META.walk;
  const Icon = meta.icon;
  const isCompleted = task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-sm ${
        isCompleted ? "border-slate-100 opacity-70" : `${meta.border}`
      }`}
    >
      <div className="flex items-stretch">
        {/* Color stripe */}
        <div className={`w-1 ${meta.bg}`} />

        {/* Content */}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-start gap-3">
            {/* Service icon */}
            <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${meta.iconColor}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 text-sm">{meta.label}</p>
                {task.quantity > 1 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                    {task.quantity}x
                  </span>
                )}
                {isCompleted && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Concluído
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                <Dog className="w-3 h-3 text-slate-400" />
                {task.dogNames || "—"}
              </p>

              <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500">
                <span className="flex items-center gap-0.5">
                  <User className="w-2.5 h-2.5" /> {task.ownerName}
                </span>
                {task.checkinDate && (
                  <span className="flex items-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(task.checkinDate).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" })}
                  </span>
                )}
              </div>

              {isCompleted && task.completed_at && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-0.5">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Concluído às {new Date(task.completed_at).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}

              {task.task_notes && (
                <p className="text-[10px] text-slate-500 mt-1 italic">"{task.task_notes}"</p>
              )}
            </div>

            {/* Price + Action */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {task.total_price > 0 && (
                <span className="text-sm font-bold text-slate-700">
                  {task.total_price.toFixed(2)}€
                </span>
              )}
              {!isCompleted && onComplete && (
                <Button
                  size="sm"
                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold gap-1"
                  onClick={() => onComplete(task)}
                >
                  <CheckCircle2 className="w-3 h-3" /> Concluir
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}