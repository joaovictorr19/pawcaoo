import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id } = await req.json();
    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.HotelBooking.get(booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // SECURITY: only participants of the booking (or admins) can access the receipt
    const email = (user.email || '').toLowerCase();
    const isParticipant = [booking.owner_email, booking.hotel_email, booking.assigned_walker_email, booking.created_by]
      .some((e) => e && String(e).toLowerCase() === email);
    if (!isParticipant && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const hotelName = booking.hotel_name || 'Hotel';
    const today = new Date();
    const dateStr = today.toLocaleDateString('pt-PT');
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(hotelName, 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Recibo de Estadia', 14, 23);
    doc.setFontSize(8);
    doc.text(`Emitido em ${dateStr}`, pageW - 14, 15, { align: 'right' });
    doc.text(`Recibo #${booking.id.slice(-8).toUpperCase()}`, pageW - 14, 23, { align: 'right' });

    // Client info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente', 14, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(booking.owner_name || '—', 14, 48);
    if (booking.owner_email) doc.text(booking.owner_email, 14, 53);
    if (booking.owner_phone) doc.text(`Tel: ${booking.owner_phone}`, 14, 58);

    // Stay info
    const stayX = 110;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Estadia', stayX, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const serviceLabels = { boarding: 'Alojamento', daycare: 'Creche', grooming: 'Grooming', walk_with_partner: 'Passeio', training: 'Treino' };
    doc.text(`Servico: ${serviceLabels[booking.service_type] || booking.service_type}`, stayX, 48);
    doc.text(`Check-in: ${booking.checkin_date || '—'}${booking.checkin_time ? ' ' + booking.checkin_time : ''}`, stayX, 53);
    doc.text(`Check-out: ${booking.checkout_date || '—'}${booking.checkout_time ? ' ' + booking.checkout_time : ''}`, stayX, 58);
    doc.text(`Noites: ${booking.total_nights || 1}`, stayX, 63);

    // Dogs
    let y = 72;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Animais', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    (booking.dogs || []).forEach((dog) => {
      const sizeLabels = { small: 'Pequeno', medium: 'Medio', large: 'Grande', extra_large: 'Extra Grande' };
      const line = `${dog.dog_name || '—'}  |  ${dog.dog_breed || 'Raça N/A'}  |  ${sizeLabels[dog.dog_size] || dog.dog_size || 'N/A'}${dog.dog_age ? '  |  ' + dog.dog_age + ' anos' : ''}`;
      doc.text(line, 14, y);
      y += 5;
    });

    // Add-ons
    if (booking.add_ons && booking.add_ons.length > 0) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('Servicos Adicionais', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const addonLabels = { walk: 'Passeio', training: 'Treino', grooming: 'Grooming', bathing: 'Banho', nail_trim: 'Corte de Unhas' };
      booking.add_ons.forEach((addon) => {
        const label = addonLabels[addon.service_name] || addon.service_name;
        const qty = addon.quantity > 1 ? ` x${addon.quantity}` : '';
        const price = addon.total_price > 0 ? `  ......  ${addon.total_price.toFixed(2)} EUR` : '';
        doc.text(`${label}${qty}${price}`, 14, y);
        y += 5;
      });
    }

    // Total
    y += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, pageW - 14, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Total', 14, y);
    doc.text(`${(booking.total_amount || 0).toFixed(2)} EUR`, pageW - 14, y, { align: 'right' });

    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Valor profissional: ${(booking.service_amount || 0).toFixed(2)} EUR | Taxa plataforma: ${(booking.platform_fee || 0).toFixed(2)} EUR`, 14, y);
    y += 5;
    const payLabels = { pending: 'Pendente', paid: 'Pago', refunded: 'Reembolsado', partial: 'Parcial' };
    doc.text(`Estado pagamento: ${payLabels[booking.payment_status] || booking.payment_status}`, 14, y);

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Este recibo foi gerado automaticamente pela plataforma PawCao.', pageW / 2, 285, { align: 'center' });

    const pdfBytes = doc.output('arraybuffer');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=recibo-${booking.id.slice(-8)}.pdf`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});