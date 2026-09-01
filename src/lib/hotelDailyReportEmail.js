// Template de email profissional para o Diário de estadia do hotel.
// Espelha o estilo visual do base44/shared/hotelEmailTemplate.ts (cabeçalho em
// gradiente teal, logótipo PawCão, tabelas estruturadas e rodapé).
// Vive no frontend porque o envio é feito pelo painel do hotel via Core.SendEmail.

const PAWCAO_LOGO_URL = "https://media.base44.com/images/public/6907b3be1ec43db5676a2085/e3013a5a7_IMG_3975.jpg";

export function buildDailyReportEmail({
  hotelName,
  ownerName,
  dogNames,
  datePt,
  moodEmoji,
  moodLabel,
  tags = [],
  note,
  photoUrls = [],
}) {
  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Olá <strong>${ownerName}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">O <strong>${hotelName}</strong> partilhou uma nova atualização do <strong>${dogNames}</strong> referente a <strong>${datePt}</strong>.</p>`;

  const detailRows = [
    ["Data", datePt],
    ["Animais", dogNames],
    ["Humor", `${moodEmoji || ""} ${moodLabel || ""}`.trim()],
  ];
  const detailsExtraRows = detailRows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:10px 16px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #f1f5f9;width:40%;">${k}</td><td style="padding:10px 16px;font-size:14px;color:#0f172a;font-weight:600;border-bottom:1px solid #f1f5f9;">${v}</td></tr>`
    )
    .join("");

  const tagsBlock =
    tags.length > 0
      ? `<div style="background:#f8fafc;border-radius:10px;padding:14px 16px;margin:16px 0;"><p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 8px;">Observações de comportamento</p>${tags
          .map((t) => `<p style="font-size:13px;color:#0f172a;margin:3px 0;">• ${t}</p>`)
          .join("")}</div>`
      : "";

  const noteBlock = note
    ? `<p style="font-size:15px;color:#0f172a;line-height:1.6;font-style:italic;margin:16px 0;">"${note}"</p>`
    : "";

  const photosBlock =
    photoUrls.length > 0
      ? `<p style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin:20px 0 8px;">Fotos do dia (${photoUrls.length})</p>${photoUrls
          .map(
            (u) =>
              `<img src="${u}" style="width:100%;border-radius:10px;margin-top:8px;border:1px solid #e2e8f0;" />`
          )
          .join("")}`
      : "";

  const footerNote = `Recebeu esta atualização através da PawCão. Pode acompanhar todos os relatórios do seu animal no seu painel de cliente na app.`;

  const body = `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0d9483,#207373);padding:28px 32px;text-align:center;">
      <img src="${PAWCAO_LOGO_URL}" alt="PawCão" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.6);margin-bottom:10px;" />
      <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:800;letter-spacing:-0.01em;">Diário de Estadia</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;font-weight:500;">${hotelName} · ${datePt}</p>
    </div>
    <div style="padding:28px 32px;">
      ${intro}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;background:#f8fafc;border-radius:10px;overflow:hidden;">
        ${detailsExtraRows}
      </table>
      ${tagsBlock}
      ${noteBlock}
      ${photosBlock}
      <p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.6;">${footerNote}</p>
    </div>
    <div style="background:#f1f5f9;padding:18px 32px;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">PawCão · A sua plataforma de cuidados para cães</p>
      <p style="font-size:11px;color:#cbd5e1;margin:4px 0 0;">Em caso de dúvida, contacte-nos através da app.</p>
    </div>
  </div>`;

  const subject = `📓 Diário do ${dogNames} — ${datePt} · ${hotelName}`;
  return { subject, body };
}