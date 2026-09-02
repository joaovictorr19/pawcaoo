// Templates de email profissionais para confirmação de reservas de passeio e treino.
// Mesmo estilo visual dos emails de hotel (logotipo, gradiente teal, tabelas destacadas).
// Usados por notifyBookingConfirmed, invocado por workflows quando a reserva fica confirmada.

import { PAWCAO_LOGO_URL, formatDatePt, euro } from "./hotelEmailTemplate.ts";

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function detailsRows(rows) {
  return rows
    .filter(([, v]) => v)
    .map(([k, v]) => `
      <tr>
        <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #f1f5f9;width:40%;">${k}</td>
        <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${esc(v)}</td>
      </tr>
    `).join("");
}

function pricingRowsHtml(rows) {
  return rows.map((r) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#475569;${r.bold ? "font-weight:700;color:#0f172a;" : ""}">${r.label}</td>
      <td style="padding:8px 0;text-align:right;font-size:14px;color:#0f172a;font-weight:${r.bold ? "700" : "600"};white-space:nowrap;">${r.value}</td>
    </tr>
  `).join("");
}

function highlightBox(b) {
  const datePt = formatDatePt(b.date);
  const when = [datePt !== "—" ? datePt : null, b.timeStr || null].filter(Boolean).join(" · ");
  return `
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:16px 20px;text-align:center;margin:20px 0;">
      <p style="margin:0;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.08em;">📅 Data e Hora</p>
      <p style="margin:6px 0 0;font-size:18px;font-weight:800;color:#065f46;">${esc(when || "—")}</p>
      ${b.durationLabel ? `<p style="margin:4px 0 0;font-size:13px;color:#047857;">Duração: ${esc(b.durationLabel)}</p>` : ""}
    </div>`;
}

function shell({ title, subtitle, intro, highlight, details, pricing, footerNote }) {
  return `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0d9483,#207373);padding:28px 32px;text-align:center;">
      <img src="${PAWCAO_LOGO_URL}" alt="PawCão" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.6);margin-bottom:10px;" />
      <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:800;letter-spacing:-0.01em;">${title}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;font-weight:500;">${subtitle}</p>
    </div>
    <div style="padding:28px 32px;">
      ${intro}
      ${highlight}
      <h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:20px 0 8px;">Detalhes</h2>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;">${details}</table>
      <h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:24px 0 8px;">Resumo de valores</h2>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;">${pricing}</table>
      ${footerNote ? `<p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.6;">${footerNote}</p>` : ""}
    </div>
    <div style="background:#f1f5f9;padding:18px 32px;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">PawCão · A sua plataforma de cuidados para cães</p>
      <p style="font-size:11px;color:#cbd5e1;margin:4px 0 0;">Em caso de dúvida, contacte-nos através da app.</p>
    </div>
  </div>`;
}

function whenLabel(b) {
  const datePt = formatDatePt(b.date);
  return [datePt !== "—" ? datePt : null, b.timeStr || null].filter(Boolean).join(" · ");
}

// Email enviado ao DONO do animal quando a reserva é confirmada
export function buildOwnerBookingConfirmedEmail(b) {
  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Olá <strong>${esc(b.ownerName)}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">O seu pedido de <strong>${esc(b.serviceName.toLowerCase())}</strong> foi <strong>confirmado</strong> por <strong>${esc(b.professionalName)}</strong>. Abaixo encontram-se os detalhes da sua reserva.</p>`;

  const details = detailsRows([
    ["Serviço", b.serviceName],
    ["Profissional", b.professionalName],
    ["Animal(is)", b.dogNames],
    ["Local", b.locationText],
    ["Tipo de treino", b.trainingType],
    ["Modalidade", b.consultation],
    ["Objetivos", b.goals],
    ["Observações", b.notes],
  ]);

  const pricing = pricingRowsHtml([
    { label: "Total pago", value: euro(b.total), bold: true },
  ]);

  const footerNote = "O pagamento foi retido em custódia pela PawCão e será libertado ao profissional apenas após a conclusão do serviço. Pode acompanhar a sua reserva na app.";

  const body = shell({
    title: `✅ Reserva Confirmada`,
    subtitle: `${esc(b.serviceName)} · ${esc(b.professionalName)}`,
    intro,
    highlight: highlightBox(b),
    details,
    pricing,
    footerNote,
  });

  return {
    subject: `✅ Reserva confirmada — ${b.serviceName} com ${b.professionalName} · ${whenLabel(b)}`,
    body,
  };
}

// Email enviado ao PROFISSIONAL (passeador/treinador) quando a reserva é confirmada
export function buildProfessionalBookingConfirmedEmail(b) {
  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Nova reserva confirmada!</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">O cliente <strong>${esc(b.ownerName)}</strong> tem um <strong>${esc(b.serviceName.toLowerCase())}</strong> confirmado consigo. O valor está retido em custódia pela PawCão e será transferido para a sua conta após a conclusão do serviço (a comissão da plataforma é deduzida automaticamente).</p>
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px 16px;margin:16px 0;">
      <p style="font-size:13px;color:#065f46;margin:0;"><strong>Cliente:</strong> ${esc(b.ownerName)}${b.ownerPhone ? ` · ${esc(b.ownerPhone)}` : ""}</p>
    </div>`;

  const details = detailsRows([
    ["Serviço", b.serviceName],
    ["Cliente", b.ownerName],
    ["Contacto", b.ownerPhone || "Não fornecido"],
    ["Animal(is)", b.dogNames],
    ["Local", b.locationText],
    ["Tipo de treino", b.trainingType],
    ["Modalidade", b.consultation],
    ["Objetivos do cliente", b.goals],
    ["Observações do cliente", b.notes],
  ]);

  const pricing = pricingRowsHtml([
    { label: "Total pago pelo cliente", value: euro(b.total) },
    { label: "Comissão PawCão (retida)", value: euro(b.platformFee) },
    { label: "Líquido a receber (após conclusão)", value: euro(b.serviceAmount), bold: true },
  ]);

  const footerNote = "Para receber o pagamento automaticamente, certifique-se de que tem o Stripe Connect configurado no seu painel. Marque a conclusão do serviço no seu painel para libertar o pagamento.";

  const body = shell({
    title: `Nova Reserva Confirmada`,
    subtitle: `${esc(b.serviceName)} · ${esc(b.ownerName)}`,
    intro,
    highlight: highlightBox(b),
    details,
    pricing,
    footerNote,
  });

  return {
    subject: `Nova reserva confirmada — ${b.ownerName} · ${b.serviceName} (${whenLabel(b)})`,
    body,
  };
}