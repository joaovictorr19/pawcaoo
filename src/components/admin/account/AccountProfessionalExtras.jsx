import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Send, FileText, Percent } from "lucide-react";
import AdminCommissionManager from "../AdminCommissionManager";

export const REQUEST_FIELDS = [
  { key: "id_document_url", label: "Documento de Identificação" },
  { key: "proof_of_address_url", label: "Comprovativo de Morada" },
  { key: "bank_account_holder", label: "Titular da Conta" },
  { key: "bank_account_number", label: "IBAN / Número de Conta" },
  { key: "bank_routing_number", label: "Código SWIFT / Routing" },
  { key: "country_of_operation", label: "País de Operação" },
  { key: "tax_id_portugal", label: "NIF Portugal" },
  { key: "tax_id_spain", label: "NIF/NIE Espanha" },
  { key: "france_professional_type", label: "Tipo Profissional França" },
  { key: "tax_id_france", label: "Número Fiscal França" }
];

function Field({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-600">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl border-slate-200" />
    </div>
  );
}

export default function AccountProfessionalExtras({
  linked,
  form,
  set,
  missingFields,
  requestFields,
  setRequestFields,
  requestMessage,
  setRequestMessage,
  requestMutation,
  commission,
}) {
  return (
    <Accordion type="multiple" className="space-y-3">
      <AccordionItem value="commission" className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-5">
        <AccordionTrigger className="hover:no-underline py-4">
          <span className="flex items-center gap-2.5 text-sm font-black text-slate-900">
            <Percent className="w-4 h-4 text-teal-700" /> Comissão da plataforma
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <AdminCommissionManager professionalProfile={linked?.professionalProfile} {...commission} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="documents" className="rounded-2xl border border-slate-200 bg-white px-4 sm:px-5">
        <AccordionTrigger className="hover:no-underline py-4">
          <span className="flex items-center gap-2.5 text-sm font-black text-slate-900">
            <FileText className="w-4 h-4 text-teal-700" /> Documentos e dados fiscais
            {missingFields.length > 0 && (
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0">
                {missingFields.length} em falta
              </Badge>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          {missingFields.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="text-xs text-amber-800 mb-2 font-semibold">Selecione os dados a pedir por email:</p>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((f) => {
                  const sel = requestFields.includes(f.key);
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setRequestFields((p) => sel ? p.filter((k) => k !== f.key) : [...p, f.key])}
                      className={"px-3 py-1.5 rounded-lg text-xs font-bold border transition " + (sel
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-teal-300")}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {REQUEST_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} value={form[f.key] || ""} onChange={(v) => set(f.key, v)} />
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600">Mensagem adicional</Label>
            <Textarea rows={2} value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Ex: por favor complete estes dados para concluir a verificação." className="rounded-xl resize-none border-slate-200" />
          </div>

          <div className="flex justify-end">
            <Button onClick={() => requestMutation.mutate()} disabled={requestFields.length === 0 || requestMutation.isPending}
              className="rounded-xl bg-slate-900 hover:bg-slate-800">
              {requestMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar pedido por email
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}