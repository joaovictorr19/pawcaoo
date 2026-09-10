// Template de email profissional para pedidos de atualização de perfil.
// Usado pela função sendProfileUpdateRequest quando o admin pede a um
// profissional ou cliente que complete/aperfeiçoe secções do seu perfil.

import { PAWCAO_LOGO_URL } from "./hotelEmailTemplate.ts";

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function buildProfileUpdateRequestEmail({
  recipient_name,
  profile_type,
  selected_items,
  custom_note,
  edit_url,
}) {
  const name = esc(recipient_name || 'utilizador');
  const isPro = profile_type === 'professional';
  const items = Array.isArray(selected_items) ? selected_items : [];

  const itemsHtml = items.map((item, i) => `
    <tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <span style="font-size:22px;line-height:1;flex-shrink:0;">${esc(item.icon || '•')}</span>
          <div>
            <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">${i + 1}. ${esc(item.label)}</p>
            ${item.description ? `<p style="margin:4px 0 0;font-size:13px;color:#64748b;line-height:1.5;">${esc(item.description)}</p>` : ''}
          </div>
        </div>
      </td>
    </tr>
  `).join('');

  const intro = `<p style="font-size:15px;color:#0f172a;margin:0 0 4px;">Olá <strong>${name}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6;margin:8px 0 0;">Estamos a analisar o seu ${isPro ? 'perfil profissional' : 'perfil'} na PawCão e identificámos algumas secções que precisam de ser completadas ou aperfeiçoadas. Para que o seu perfil esteja <strong>100% completo</strong>${isPro ? ' e visível para os clientes' : ''}, por favor atualize os itens indicados abaixo.</p>`;

  const noteBlock = custom_note ? `
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:14px 16px;margin:18px 0;">
      <p style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 6px;">Nota da equipa PawCão</p>
      <p style="font-size:14px;color:#78350f;line-height:1.6;margin:0;">${esc(custom_note)}</p>
    </div>` : '';

  const cta = edit_url ? `
    <div style="text-align:center;margin:24px 0 8px;">
      <a href="${esc(edit_url)}" style="display:inline-block;background:#0d9483;color:#ffffff;padding:14px 36px;border-radius:9999px;font-weight:700;font-size:15px;text-decoration:none;">Atualizar o meu perfil</a>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:8px 0 0;">Clique no botão acima para abrir o formulário de edição na app.</p>` : '';

  const body = `<div style="font-family:'Poppins',Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0d9483,#207373);padding:28px 32px;text-align:center;">
      <img src="${PAWCAO_LOGO_URL}" alt="PawCão" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.6);margin-bottom:10px;" />
      <h1 style="color:#ffffff;font-size:20px;margin:0;font-weight:800;letter-spacing:-0.01em;">Atualização do Perfil Necessária</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;font-weight:500;">Dog Care Platform</p>
    </div>
    <div style="padding:28px 32px;">
      ${intro}
      <h2 style="font-size:14px;font-weight:700;color:#0f172a;margin:24px 0 8px;letter-spacing:-0.01em;">Secções a atualizar</h2>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:10px;overflow:hidden;">
        ${itemsHtml}
      </table>
      ${noteBlock}
      ${cta}
    </div>
    <div style="background:#f1f5f9;padding:18px 32px;text-align:center;">
      <p style="font-size:11px;color:#94a3b8;margin:0;">PawCão · A sua plataforma de cuidados para cães</p>
      <p style="font-size:11px;color:#cbd5e1;margin:4px 0 0;">Em caso de dúvida, contacte-nos através da app.</p>
    </div>
  </div>`;

  const subject = `Atualização do seu perfil na PawCão`;
  return { subject, body };
}