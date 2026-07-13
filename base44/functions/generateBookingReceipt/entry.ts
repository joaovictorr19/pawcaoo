import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking_id, booking_type } = await req.json();
    if (!booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    const isTraining = booking_type === 'training';
    const entity = isTraining ? base44.entities.TrainingBooking : base44.entities.Booking;
    const booking = await entity.get(booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });

    // Authorization: only the owner or the professional can generate the receipt
    const isOwner = booking.created_by_id === user.id || booking.owner_email === user.email;
    const isPro = isTraining ? booking.trainer_email === user.email : booking.walker_email === user.email;
    const isAdmin = user.role === 'admin';
    if (!isOwner && !isPro && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const professionalName = isTraining ? (booking.trainer_name || 'Profissional') : (booking.walker_name || 'Profissional');
    const serviceDate = isTraining ? booking.session_date : booking.walk_date;
    const serviceTime = isTraining ? booking.session_time : booking.walk_time;
    const serviceLabel = isTraining ? 'Sessao de Treino' : 'Passeio de Cao';

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
    doc.text('PawCao', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Recibo de Servico', 14, 23);
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

    // Service info
    const svcX = 110;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Servico', svcX, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Tipo: ${serviceLabel}`, svcX, 48);
    doc.text(`Data: ${serviceDate || '—'}`, svcX, 53);
    if (serviceTime) doc.text(`Hora: ${serviceTime}`, svcX, 58);
    if (booking.dog_name) doc.text(`Cao: ${booking.dog_name}`, svcX, 63);

    // Professional
    let y = 72;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Profissional', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(professionalName, 14, y);
    y += 5;
    if (isTraining ? booking.trainer_email : booking.walker_email) {
      doc.text(isTraining ? booking.trainer_email : booking.walker_email, 14, y);
      y += 5;
    }

    // Duration / extras
    if (booking.duration_hours) {
      y += 3;
      doc.text(`Duracao: ${booking.duration_hours}h`, 14, y);
      y += 5;
    }
    if (booking.special_notes) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.text('Notas:', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      const notes = doc.splitTextToSize(booking.special_notes, pageW - 28);
      doc.text(notes, 14, y);
      y += notes.length * 5;
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
    if (booking.tip_amount && booking.tip_amount > 0) {
      y += 5;
      doc.text(`Gorjeta: ${booking.tip_amount.toFixed(2)} EUR`, 14, y);
    }
    y += 5;
    const payLabels = { pending: 'Pendente', held: 'Em garantia', released: 'Liberado', refunded: 'Reembolsado' };
    doc.text(`Estado pagamento: ${payLabels[booking.payment_status] || booking.payment_status || 'N/A'}`, 14, y);

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
    console.error('generateBookingReceipt error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});