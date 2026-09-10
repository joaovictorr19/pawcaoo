import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link2, Copy, Check, Loader2, Save, ExternalLink } from "lucide-react";
import { slugify } from "@/utils/profileSlug";

const RESERVED_SLUGS = [
  "login", "register", "admin", "dashboard", "settings", "loja", "shop",
  "pawgo", "api", "functions", "reset-password", "forgot-password",
  "portugal", "espanha", "franca", "home", "userprofile", "professionals",
  "profile", "account", "logout", "bookings", "wallet", "favorites",
];

export default function PublicLinkSection({ professionalProfile, userEmail }) {
  const [currentSlug, setCurrentSlug] = useState("");
  const [editing, setEditing] = useState(false);
  const [inputSlug, setInputSlug] = useState("");
  const [availability, setAvailability] = useState({ status: "idle", message: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(true);
  const checkTimeoutRef = useRef(null);
  const email = userEmail || professionalProfile?.created_by;

  const entityName = professionalProfile?.hotel_details?.hotel_name
    || professionalProfile?.walker_name
    || professionalProfile?.trainer_name
    || "";
  const entityType = professionalProfile?.hotel_details ? "hotel"
    : professionalProfile?.trainer_name ? "trainer"
    : "walker";

  // Buscar slug atual do profissional
  useEffect(() => {
    let cancelled = false;
    async function loadSlug() {
      if (!email) { setLoadingCurrent(false); return; }
      setLoadingCurrent(true);
      try {
        const existing = await base44.entities.ProfileSlug.filter({ entity_email: email });
        if (!cancelled && existing?.length > 0) {
          setCurrentSlug(existing[0].slug);
        } else if (!cancelled) {
          // Fallback: slug do nome (ainda não registado, mas funciona via ShortProfile lazy backfill)
          const fallback = slugify(entityName) || slugify(email);
          setCurrentSlug(fallback);
        }
      } catch (e) {
        const fallback = slugify(entityName) || slugify(email);
        if (!cancelled) setCurrentSlug(fallback);
      } finally {
        if (!cancelled) setLoadingCurrent(false);
      }
    }
    loadSlug();
    return () => { cancelled = true; };
  }, [email, entityName]);

  // Validação de unicidade em tempo real (debounced)
  useEffect(() => {
    if (!editing || !inputSlug) {
      setAvailability({ status: "idle", message: "" });
      return;
    }
    const cleaned = slugify(inputSlug);
    if (cleaned.length < 3) {
      setAvailability({ status: "invalid", message: "Mínimo 3 caracteres" });
      return;
    }
    if (RESERVED_SLUGS.includes(cleaned)) {
      setAvailability({ status: "taken", message: "Palavra reservada" });
      return;
    }
    // Se é igual ao slug atual, está disponível (é o dele)
    if (cleaned === currentSlug) {
      setAvailability({ status: "available", message: "É o seu link atual" });
      return;
    }

    setAvailability({ status: "checking", message: "A verificar..." });
    clearTimeout(checkTimeoutRef.current);
    checkTimeoutRef.current = setTimeout(async () => {
      try {
        const existing = await base44.entities.ProfileSlug.filter({ slug: cleaned });
        if (existing?.length > 0) {
          const mine = existing.find(s => s.entity_email === email);
          setAvailability({
            status: mine ? "available" : "taken",
            message: mine ? "É o seu link atual" : "Já em uso por outro profissional",
          });
        } else {
          setAvailability({ status: "available", message: "Disponível!" });
        }
      } catch (e) {
        setAvailability({ status: "idle", message: "" });
      }
    }, 500);

    return () => clearTimeout(checkTimeoutRef.current);
  }, [inputSlug, editing, currentSlug, email]);

  const handleStartEdit = () => {
    setInputSlug(currentSlug);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setInputSlug("");
    setAvailability({ status: "idle", message: "" });
  };

  const handleSave = async () => {
    const newSlug = slugify(inputSlug);
    if (newSlug.length < 3) {
      toast.error("O link precisa de ter pelo menos 3 caracteres.");
      return;
    }
    if (availability.status !== "available") {
      toast.error("Escolha um link disponível.");
      return;
    }
    if (newSlug === currentSlug) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      // 1. Apagar o slug antigo deste profissional (se existir e for diferente)
      try {
        const oldSlugs = await base44.entities.ProfileSlug.filter({ entity_email: email });
        for (const s of oldSlugs) {
          if (s.slug !== newSlug) {
            await base44.entities.ProfileSlug.delete(s.id);
          }
        }
      } catch (e) { /* pode não existir */ }

      // 2. Criar o novo slug
      try {
        await base44.entities.ProfileSlug.create({
          slug: newSlug,
          entity_type: entityType,
          entity_email: email,
          display_name: entityName,
        });
      } catch (e) {
        // Se já existe (corrida), verificar se é dele
        const existing = await base44.entities.ProfileSlug.filter({ slug: newSlug });
        if (!existing?.find(s => s.entity_email === email)) {
          throw e;
        }
      }

      setCurrentSlug(newSlug);
      setEditing(false);
      setInputSlug("");
      toast.success("Link público atualizado com sucesso!");
    } catch (e) {
      toast.error("Erro ao guardar link: " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    const fullUrl = `${window.location.origin}/${currentSlug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error("Não foi possível copiar");
    }
  };

  const cleanedInput = slugify(inputSlug);
  const canSave = availability.status === "available" && cleanedInput !== currentSlug && cleanedInput.length >= 3;
  const availabilityColor = availability.status === "available" ? "text-emerald-600"
    : availability.status === "taken" || availability.status === "invalid" ? "text-red-500"
    : "text-slate-400";

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
          <Link2 className="w-4 h-4 text-teal-600" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600 m-0">Link Público do Perfil</Label>
          <p className="text-[10px] text-slate-400">Partilhe este link nas redes sociais ou com clientes</p>
        </div>
      </div>

      {loadingCurrent ? (
        <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> A carregar link...
        </div>
      ) : !editing ? (
        <div className="space-y-2.5">
          {/* Link atual */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">{window.location.origin}</span>
            <span className="text-xs text-slate-400 shrink-0 sm:hidden">…/</span>
            <span className="text-sm font-semibold text-slate-900 truncate flex-1">/{currentSlug}</span>
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              aria-label="Copiar link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 rounded-lg text-xs border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
              onClick={handleStartEdit}
            >
              <Link2 className="w-3.5 h-3.5" /> Personalizar link
            </Button>
            <a
              href={`${window.location.origin}/${currentSlug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs border border-slate-200 text-teal-600 hover:bg-teal-50 transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Ver
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {/* Campo de edição */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
              {window.location.origin.replace(/^https?:\/\//, '')}/
            </span>
            <Input
              value={inputSlug}
              onChange={(e) => setInputSlug(slugify(e.target.value))}
              placeholder="o-meu-link"
              className="rounded-lg pl-[calc(100px)] text-sm font-semibold"
              autoFocus
            />
          </div>

          {/* Indicador de disponibilidade */}
          <div className="flex items-center gap-1.5 text-[11px] min-h-[16px]">
            {availability.status === "checking" && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
            {availability.status === "available" && <Check className="w-3 h-3 text-emerald-600" />}
            {(availability.status === "taken" || availability.status === "invalid") && <span className="w-3 h-3 rounded-full bg-red-500" />}
            <span className={availabilityColor}>{availability.message}</span>
          </div>

          <p className="text-[10px] text-slate-400">
            Apenas minúsculas, números e hífens. Mínimo 3 caracteres.
          </p>

          {/* Botões */}
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 h-9 rounded-lg text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5 disabled:opacity-40"
              onClick={handleSave}
              disabled={!canSave || saving}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar link
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-lg text-xs border-slate-200 text-slate-600"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}