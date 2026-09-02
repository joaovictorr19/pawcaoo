// Templates de email profissionais para confirmação de reservas de hotel.
// Usados pelo webhook do Stripe (stripeWebhook) para enviar emails ao cliente
// e ao hotel imediatamente após o pagamento ser confirmado.

export const PAWCAO_LOGO_URL = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/e3013a5a7_IMG_3975.jpg";

const SERVICE_LABELS = {
  boarding: "Alojamento",
  daycare: "Creche Diurna",
  grooming: "Banho & Tosquia",
  walk_with_partner: "Passeio com Parceiro",
  training: "Treino",
  dropin: "Assistência em Casa",
};

const SERVICE_DESCRIPTIONS = {
  boarding: "reserva de alojamento canino",
  daycare: "reserva de creche diurna",
  grooming: "marcação de banho e tosquia",
  walk_with_partner: "marcação de passeio com parceiro",
  training: "marcação de sessão de treino",
  dropin: "marcação de assistência em casa",
};

const TRANSPORT_LABELS = {
  round_trip: "Ida e Volta",
  pickup_only: "Só Recolha (ida)",
  dropoff_only: "Só Entrega (volta)",
};

export function formatDatePt(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric" }).format(d);
  } catch {
    return dateStr;
  }
}

function formatDateTimePt(dateStr, timeStr) {
  const base = formatDatePt(dateStr);
  if (timeStr) return `${base} · ${timeStr}`;
  return base;
}

function durationLabel(hb) {
  if (hb.service_type === "boarding") {
    const n = hb.total_nights || 1;
    return `${n} ${n === 1 ? "noite" : "noites"}`;
  }
  if (hb.service_type === "daycare") return "1 dia (creche)";
  if (hb.service_type === "walk_with_partner") return `${hb.walk_duration || 60} minutos`;
  if (hb.service_type === "training") return "Sessão de treino";
  if (hb.service_type === "dropin") return hb.service_duration_minutes ? `${hb.service_duration_minutes} minutos` : "Visita domiciliária";
  if (hb.service_type === "grooming") {
    const labels = { bath_only: "Banho", bath_and_grooming: "Banho & Tosquia", grooming_only: "Tosquia", full_grooming: "Banho & Tosquia Completo" };
    return labels[hb.grooming_type] || "Banho & Tosquia";
  }
  return "";
}

function dogList(dogs) {
  if (!dogs || dogs.length === 0) return "—";
  return dogs.map((d) => {
    const parts = [d.dog_name || "Cão"];
    if (d.dog_breed) parts.push(d.dog_breed);
    return parts.join(" — ");
  }).join(", ");
}

export function euro(n) {
  return `€${Number(n || 0).toFixed(2)}`;
}

// Linha de valores reutilizável
function pricingRows(hb) {
  const rows = [];
  const base = (hb.total_amount || 0) - (hb.platform_fee || 0) - (hb.transport_price || 0) - (hb.pickup_fee || 0);
  rows.push({ label: "Serviço", value: euro(base) });
  if (hb.transport_requested && (hb.transport_price || 0) > 0) {
    rows.push({ label: "Transporte", value: euro(hb.transport_price) });
  }
  if (hb.pickup_fee && hb.pickup_fee > 0) {
    rows.push({ label: "Recolha ao domicílio", value: euro(hb.pickup_fee) });
  }
  rows.push({ label: "Total pago", value: euro(hb.total_amount), bold: true });
  return rows;
}

function rowsHtml(rows) {
  return rows.map((r) => `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#475569;${r.bold ? "font-weight:700;color:#0f172a;" : ""}">${r.label}</td>
      <td style="padding:8px 0;text-align:right;font-size:14px;color:#0f172a;font-weight:${r.bold ? "700" : "600"};white-space:nowrap;">${r.value}</td>
    </tr>
  `).join("");
}

function detailsTable(hb) {
  const rows = [];
  rows.push(["Serviço", SERVICE_LABELS[hb.service_type] || hb.service_type]);
  rows.push(["Duração", durationLabel(hb)]);
  rows.push(["Animais", dogList(hb.dogs)]);
  rows.push(["Check-in", formatDateTimePt(hb.checkin_date, hb.checkin_time)]);
  if (hb.service_type === "boarding" && hb.checkout_date && hb.checkout_date !== hb.checkin_date) {
    rows.push(["Check-out", formatDateTimePt(hb.checkout_date, hb.checkout_time)]);
  }
  if (hb.service_type === "grooming" || hb.service_type === "walk_with_partner" || hb.service_type === "training" || hb.service_type === "dropin") {
    rows.push(["Data", formatDateTimePt(hb.checkin_date, hb.checkin_time)]);
  }
  return rows.map(([k, v]) => `
    <tr>
      <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #f1f5f9;width:40%;">${k}</td>
      <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${v}</td>
    </tr>
  `).join("");
}

function transportBlock(hb) {
  if (!hb.transport_requested) {
    return `
      <tr>
        <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #f1f5f9;width:40%;">Transporte</td>
        <td style="padding:10px 16px;font-size:14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Sem transporte solicitado</td>
      </tr>
    `;
  }
  const type = TRANSPORT_LABELS[hb.transport_type] || "Ida e Volta";
  return `
    <tr>
      <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #f1f5f9;width:40%;">Transporte</td>
      <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">
        ${type} · ${euro(hb.transport_price || 0)}
        ${hb.transport_status === "pending" ? '<span style="display:block;font-size:11px;color:#f59e0b;margin-top:2px;">Aguarda confirmação do hotel</span>' : ""}
      </td>
    </tr>
  `;
}

function pickupBlock(hb) {
  if (!hb.pickup_enabled) return "";
  const addr = [hb.pickup_address, hb.pickup_city, hb.pickup_postal_code].filter(Boolean).join(", ");
  return `
    <tr>
      <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #f1f5f9;width:40%;">Recolha</td>
      <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">
        ${addr || "Morada a combinar"}${hb.pickup_time ? ` · ${hb.pickup_time}` : ""}
      </td>
    </tr>
  `;
}

function shell({ title, intro, detailsExtraRows, pricingExtraRows, footerNote }) {
  return `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0d9483,#207373);padding:28px 32px;text-align:center;">
      <img src="${PAWCAO_LOGO_URL}" alt="PawCão" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.6);margin-bottom:10px;" />
      <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:800;letter-spacing:-0.01em;">${title}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;font-weight:500;">Dog Care Platform</p>
    </div>
    <div style="padding:28px 32px;">
      ${intro}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:10px;overflow:hidden;">
        ${detailsExtraRows}
      </table>
      <h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:24px 0 8px;letter-spacing:-0.01em;">Resumo de valores</h2>
      <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;">
        ${pricingExtraRows}
      </table>
      ${footerNote ? `<p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.6;">${footerNote}</p>` : ""}
    </div>
    <div style="background:#f1f5f9;padding:18px 32px;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">PawCão · A sua plataforma de cuidados para cães</p>
      <p style="font-size:11px;color:#cbd5e1;margin:4px 0 0;">Em caso de dúvida, contacte-nos através da app.</p>
    </div>
  </div>`;
}

export function buildClientConfirmationEmail(hb) {
  const serviceLabel = SERVICE_LABELS[hb.service_type] || hb.service_type;
  const hotelName = hb.hotel_name || "Hotel";
  const ownerName = hb.owner_name || "Cliente";

  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Olá <strong>${ownerName}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">O seu pagamento foi processado com sucesso. A sua <strong>${SERVICE_DESCRIPTIONS[hb.service_type] || "reserva"}</strong> no <strong>${hotelName}</strong> está confirmada. Abaixo encontram-se os detalhes da sua reserva.</p>`;

  const detailsExtraRows = detailsTable(hb) + transportBlock(hb) + pickupBlock(hb);

  const pricingExtraRows = rowsHtml(pricingRows(hb));

  const footerNote = `O pagamento foi retido em custódia pela PawCão e será libertado ao hotel apenas após a conclusão do serviço. A comissão da plataforma é deduzida automaticamente.`;

  const body = shell({
    title: "Confirmação de Reserva",
    intro,
    detailsExtraRows,
    pricingExtraRows,
    footerNote,
  });

  const subject = `Confirmação da sua reserva — ${hotelName} • ${serviceLabel}`;
  return { subject, body };
}

export function buildHotelConfirmationEmail(hb) {
  const serviceLabel = SERVICE_LABELS[hb.service_type] || hb.service_type;
  const ownerName = hb.owner_name || "Cliente";
  const ownerEmail = hb.owner_email || "";
  const ownerPhone = hb.owner_phone || "";

  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Nova reserva confirmada!</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">O cliente <strong>${ownerName}</strong> pagou uma <strong>${SERVICE_DESCRIPTIONS[hb.service_type] || "reserva"}</strong>. O valor está retido em custódia pela PawCão e será transferido para a sua conta Stripe após a conclusão do serviço (a comissão da plataforma é deduzida automaticamente).</p>
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px 16px;margin:16px 0;">
      <p style="font-size:13px;color:#065f46;margin:0;"><strong>Cliente:</strong> ${ownerName}${ownerEmail ? ` · ${ownerEmail}` : ""}${ownerPhone ? ` · ${ownerPhone}` : ""}</p>
    </div>`;

  const detailsExtraRows = detailsTable(hb) + transportBlock(hb) + pickupBlock(hb);

  const hotelRows = [
    ...pricingRows(hb),
    { label: "Comissão PawCão (retida)", value: euro(hb.platform_fee || 0) },
    { label: "Líquido a receber (após conclusão)", value: euro((hb.total_amount || 0) - (hb.platform_fee || 0)), bold: true },
  ];
  const pricingExtraRows = rowsHtml(hotelRows);

  const footerNote = `Para receber o pagamento automaticamente, certifique-se de que tem o Stripe Connect configurado no seu painel. Marque o check-out/conclusão da reserva no seu painel para libertar o pagamento.`;

  const body = shell({
    title: "Nova Reserva Recebida",
    intro,
    detailsExtraRows,
    pricingExtraRows,
    footerNote,
  });

  const subject = `Nova reserva confirmada — ${ownerName} • ${serviceLabel} (${formatDatePt(hb.checkin_date)})`;
  return { subject, body };
}

// --- Lembretes (check-in / check-out) ---

function reminderShell({ title, subtitle, intro, detailsExtraRows, note, footerNote }) {
  return `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0d9483,#207373);padding:28px 32px;text-align:center;">
      <img src="${PAWCAO_LOGO_URL}" alt="PawCão" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.6);margin-bottom:10px;" />
      <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:800;letter-spacing:-0.01em;">${title}</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;font-weight:500;">${subtitle}</p>
    </div>
    <div style="padding:28px 32px;">
      ${intro}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:10px;overflow:hidden;">
        ${detailsExtraRows}
      </table>
      ${note ? `<p style="font-size:14px;color:#475569;line-height:1.6;margin:16px 0;">${note}</p>` : ""}
      ${footerNote ? `<p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.6;">${footerNote}</p>` : ""}
    </div>
    <div style="background:#f1f5f9;padding:18px 32px;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">PawCão · A sua plataforma de cuidados para cães</p>
      <p style="font-size:11px;color:#cbd5e1;margin:4px 0 0;">Em caso de dúvida, contacte-nos através da app.</p>
    </div>
  </div>`;
}

function simpleDetailsHtml(rows) {
  return rows.map(([k, v]) => `
    <tr>
      <td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #f1f5f9;width:40%;">${k}</td>
      <td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${v}</td>
    </tr>
  `).join("");
}

export function buildCheckinReminderEmail(hb) {
  const hotelName = hb.hotel_name || "Hotel";
  const ownerName = hb.owner_name || "Cliente";
  const serviceLabel = SERVICE_LABELS[hb.service_type] || hb.service_type || "Alojamento";
  const checkinDatePt = formatDatePt(hb.checkin_date);
  const checkoutDatePt = formatDatePt(hb.checkout_date);

  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Olá <strong>${ownerName}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">Este é um lembrete de que o check-in do(s) seu(s) animal(is) no <strong>${hotelName}</strong> está marcado para <strong>amanhã, ${checkinDatePt}</strong>${hb.checkin_time ? ` pelas <strong>${hb.checkin_time}</strong>` : ""}.</p>`;

  const rows = [
    ["Serviço", serviceLabel],
    ["Animais", dogList(hb.dogs)],
    ["Check-in", hb.checkin_time ? `${checkinDatePt} · ${hb.checkin_time}` : checkinDatePt],
  ];
  if (hb.service_type === "boarding" && hb.checkout_date) {
    rows.push(["Check-out", hb.checkout_time ? `${checkoutDatePt} · ${hb.checkout_time}` : checkoutDatePt]);
  }

  const note = `Recomendamos que chegue dentro do horário de check-in estabelecido. Em caso de alteração, contacte o hotel diretamente através da app.`;
  const footerNote = `Recebeu este lembrete porque tem uma reserva confirmada na PawCão.`;

  const body = reminderShell({
    title: "Lembrete de Check-in",
    subtitle: `${hotelName} · amanhã · ${checkinDatePt}`,
    intro,
    detailsExtraRows: simpleDetailsHtml(rows),
    note,
    footerNote,
  });

  const subject = `📍 Check-in amanhã no ${hotelName} · ${checkinDatePt}`;
  return { subject, body };
}

export function buildCheckoutReminderEmail(hb) {
  const hotelName = hb.hotel_name || "Hotel";
  const ownerName = hb.owner_name || "Cliente";
  const datePt = formatDatePt(hb.checkout_date);

  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Olá <strong>${ownerName}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">Lembramos que hoje, <strong>${datePt}</strong>${hb.checkout_time ? ` pelas <strong>${hb.checkout_time}</strong>` : ""}, é o dia de check-out do(s) seu(s) animal(is) do <strong>${hotelName}</strong>.</p>`;

  const rows = [
    ["Animais", dogList(hb.dogs)],
    ["Check-out", hb.checkout_time ? `${datePt} · ${hb.checkout_time}` : datePt],
  ];

  const note = `Por favor dirija-se ao hotel dentro do horário de check-out para levantar o(s) seu(s) animal(is). Em caso de impedimento, contacte o hotel com a maior brevidade através da app.`;
  const footerNote = `Obrigado por confiar na PawCão para cuidar dos seus animais.`;

  const body = reminderShell({
    title: "Lembrete de Check-out",
    subtitle: `${hotelName} · hoje · ${datePt}`,
    intro,
    detailsExtraRows: simpleDetailsHtml(rows),
    note,
    footerNote,
  });

  const subject = `📍 Hoje é o check-out no ${hotelName} · ${datePt}`;
  return { subject, body };
}