import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";

const ACCENTS = {
  teal: "border-teal-200 bg-teal-50/50",
  blue: "border-blue-200 bg-blue-50/50",
  purple: "border-purple-200 bg-purple-50/50",
  orange: "border-orange-200 bg-orange-50/50",
  red: "border-red-200 bg-red-50/50",
};
const TITLE_COLORS = {
  teal: "text-teal-800",
  blue: "text-blue-800",
  purple: "text-purple-800",
  orange: "text-orange-800",
  red: "text-red-800",
};

export function SectionCard({ icon: Icon, title, subtitle, accent, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className={ACCENTS[accent]}>
      <CardHeader className="pb-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className={`text-base flex items-center gap-2 ${TITLE_COLORS[accent]}`}>
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export function ActionButton({ onClick, disabled, loading, loadingLabel, icon: Icon, label, variant = "outline", className = "" }) {
  return (
    <Button onClick={onClick} disabled={disabled} variant={variant} className={`w-full justify-start ${className}`}>
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Icon className="w-4 h-4 mr-2 flex-shrink-0" />}
      <span className="text-xs">{loading ? loadingLabel || "A processar..." : label}</span>
    </Button>
  );
}

export function LogPanel({ logs }) {
  if (logs.length === 0) return null;
  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      {logs.map((line, i) => (
        <p
          key={i}
          className={`text-xs font-mono p-2 rounded border ${
            line.type === "error"
              ? "bg-red-50 border-red-200 text-red-900"
              : line.type === "warn"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-slate-50 border-slate-200 text-slate-700"
          }`}
        >
          <span className="text-slate-400 mr-2">{new Date(line.time).toLocaleTimeString("pt-PT")}</span>
          {line.msg}
        </p>
      ))}
    </div>
  );
}