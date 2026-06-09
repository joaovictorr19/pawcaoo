import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// This webhook is triggered when booking status changes to 'completed'
// Call this from the booking completion flow

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validate webhook signature or auth header
    const authHeader = req.headers.get('authorization');
    const webhookSecret = Deno.env.get('INVOICE_WEBHOOK_SECRET');
    
    // If Authorization header is missing, fall back to user authentication (admin-only)
    if (!authHeader && webhookSecret) {
      return Response.json({ error: 'Missing authorization header' }, { status: 401 });
    }

    // If Authorization header is present, validate it
    if (authHeader && webhookSecret) {
      const expectedAuth = `Bearer ${webhookSecret}`;
      if (authHeader !== expectedAuth) {
        return Response.json({ error: 'Invalid authorization' }, { status: 401 });
      }
    } else if (!authHeader) {
      // No webhook secret configured, require admin auth
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }
    }

    const { booking_id, event_type } = await req.json();

    if (event_type !== 'booking.completed') {
      return Response.json({ message: 'Event ignored' });
    }

    if (!booking_id) {
      return Response.json({ error: 'booking_id required' }, { status: 400 });
    }

    // Fetch booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];

    if (!booking || booking.status !== 'completed') {
      return Response.json({ error: 'Invalid booking or not completed' }, { status: 400 });
    }

    // Check if invoice already exists
    const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({
      booking_id: booking_id
    });

    if (existingInvoices.length > 0) {
      return Response.json({ 
        message: 'Invoice already exists',
        invoice_id: existingInvoices[0].id
      });
    }

    // Fetch professional tax data
    const professionalEmail = booking.walker_email || booking.trainer_email;
    const taxDataRecords = await base44.asServiceRole.entities.ProfessionalTaxData.filter({
      professional_email: professionalEmail
    });
    const taxData = taxDataRecords[0];

    // Calculate amounts
    const grossAmount = booking.service_amount || 0;
    const platformFee = booking.platform_fee || 0;
    const netAmount = grossAmount - platformFee;
    const vatRate = taxData?.is_vat_registered ? (taxData.vat_rate || 0) : 0;
    const vatAmount = vatRate > 0 ? (netAmount * vatRate / 100) : 0;
    const totalAmount = netAmount + vatAmount;

    const serviceDate = booking.walk_date || booking.session_date;
    const serviceType = booking.type === 'training' ? 'Sessão de Treino' : 'Passeio de Cão';
    const serviceDescription = `${serviceType} - ${booking.dog_name} - ${serviceDate}`;

    // Create invoice record (manual/pending if no tax data)
    const invoiceRecord = {
      invoice_number: `PW-${Date.now()}`,
      invoice_type: 'professional_receipt',
      booking_id: booking_id,
      professional_email: professionalEmail,
      professional_name: booking.walker_name || booking.trainer_name,
      professional_tax_id: taxData?.tax_id || '',
      client_email: booking.owner_email || booking.created_by,
      client_name: booking.owner_name,
      service_date: serviceDate,
      service_description: serviceDescription,
      gross_amount: grossAmount,
      platform_fee: platformFee,
      net_amount: netAmount,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      currency: 'EUR',
      status: taxData?.tax_id ? 'pending' : 'error',
      error_message: !taxData?.tax_id ? 'Dados fiscais incompletos - preencha o NIF' : null,
      invoicing_software: 'manual',
      issued_at: new Date().toISOString()
    };

    const createdInvoice = await base44.asServiceRole.entities.Invoice.create(invoiceRecord);

    // Notify professional
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: professionalEmail,
      title: taxData?.tax_id ? '📄 Fatura Pendente' : '⚠️ Dados Fiscais Necessários',
      message: taxData?.tax_id 
        ? `Nova fatura pendente para o serviço de ${serviceDate}. Aceda às configurações fiscais para gerar o documento.`
        : `Complete os seus dados fiscais (NIF) para gerar faturas dos seus serviços.`,
      type: 'system',
      related_id: createdInvoice.id,
      priority: taxData?.tax_id ? 'normal' : 'high',
      action_url: '/FiscalSettings'
    });

    return Response.json({
      success: true,
      invoice_id: createdInvoice.id,
      status: createdInvoice.status
    });

  } catch (error) {
    console.error('Invoice webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});