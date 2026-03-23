import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const INVOICEXPRESS_API_KEY = Deno.env.get("INVOICEXPRESS_API_KEY");
const INVOICEXPRESS_ACCOUNT = Deno.env.get("INVOICEXPRESS_ACCOUNT_NAME");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { booking_id, force_regenerate } = await req.json();
    
    if (!booking_id) {
      return Response.json({ error: 'booking_id is required' }, { status: 400 });
    }

    // Fetch booking
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];
    
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'completed' && !force_regenerate) {
      return Response.json({ error: 'Booking must be completed to generate invoice' }, { status: 400 });
    }

    // Check if invoice already exists
    const existingInvoices = await base44.asServiceRole.entities.Invoice.filter({ 
      booking_id: booking_id,
      invoice_type: 'professional_receipt'
    });
    
    if (existingInvoices.length > 0 && !force_regenerate) {
      return Response.json({ 
        success: true, 
        message: 'Invoice already exists',
        invoice: existingInvoices[0]
      });
    }

    // Fetch professional tax data
    const professionalEmail = booking.walker_email || booking.trainer_email;
    const taxDataRecords = await base44.asServiceRole.entities.ProfessionalTaxData.filter({
      professional_email: professionalEmail
    });
    const taxData = taxDataRecords[0];

    if (!taxData || !taxData.tax_id) {
      return Response.json({ 
        error: 'Professional tax data incomplete. NIF/NIE/SIRET required.',
        missing: 'tax_id'
      }, { status: 400 });
    }

    // Calculate amounts
    const grossAmount = booking.service_amount || 0;
    const platformFee = booking.platform_fee || 0;
    const netAmount = grossAmount - platformFee;
    const vatRate = taxData.is_vat_registered ? (taxData.vat_rate || 0) : 0;
    const vatAmount = vatRate > 0 ? (netAmount * vatRate / 100) : 0;
    const totalAmount = netAmount + vatAmount;

    // Service description
    const serviceDate = booking.walk_date || booking.session_date;
    const serviceType = booking.type === 'training' ? 'Sessão de Treino' : 'Passeio de Cão';
    const serviceDescription = `${serviceType} - ${booking.dog_name} - ${serviceDate}`;

    let externalInvoiceId = null;
    let pdfUrl = null;
    let invoiceNumber = `PW-${Date.now()}`;
    let invoicingStatus = 'generated';

    // Try InvoiceXpress integration if configured
    if (INVOICEXPRESS_API_KEY && INVOICEXPRESS_ACCOUNT) {
      try {
        // Create client in InvoiceXpress (or get existing)
        const clientPayload = {
          client: {
            name: taxData.legal_name || booking.walker_name || booking.trainer_name,
            code: taxData.tax_id,
            fiscal_id: taxData.tax_id,
            email: professionalEmail,
            address: taxData.fiscal_address || '',
            city: taxData.fiscal_city || '',
            postal_code: taxData.fiscal_postal_code || '',
            country: taxData.country || 'PT'
          }
        };

        // Create simplified invoice (Fatura-Recibo)
        const invoicePayload = {
          simplified_invoice: {
            date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            client: {
              name: taxData.legal_name,
              code: taxData.tax_id
            },
            items: [
              {
                name: serviceDescription,
                description: `Serviço prestado via PawCão em ${serviceDate}`,
                unit_price: netAmount,
                quantity: 1,
                tax: {
                  name: vatRate > 0 ? 'IVA' : 'Isento',
                  value: vatRate
                }
              }
            ],
            observations: `Booking ID: ${booking_id}\nTaxa plataforma: €${platformFee.toFixed(2)}`
          }
        };

        const invoiceResponse = await fetch(
          `https://${INVOICEXPRESS_ACCOUNT}.app.invoicexpress.com/simplified_invoices.json?api_key=${INVOICEXPRESS_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoicePayload)
          }
        );

        if (invoiceResponse.ok) {
          const invoiceData = await invoiceResponse.json();
          externalInvoiceId = invoiceData.simplified_invoice?.id?.toString();
          invoiceNumber = invoiceData.simplified_invoice?.inverted_sequence_number || invoiceNumber;

          // Get PDF
          if (externalInvoiceId) {
            const pdfResponse = await fetch(
              `https://${INVOICEXPRESS_ACCOUNT}.app.invoicexpress.com/simplified_invoices/${externalInvoiceId}.pdf?api_key=${INVOICEXPRESS_API_KEY}`
            );
            
            if (pdfResponse.ok) {
              // In production, upload to secure storage (S3, etc.)
              // For now, use the InvoiceXpress URL with signed access
              pdfUrl = `https://${INVOICEXPRESS_ACCOUNT}.app.invoicexpress.com/simplified_invoices/${externalInvoiceId}.pdf?api_key=${INVOICEXPRESS_API_KEY}`;
            }
          }
          
          invoicingStatus = 'generated';
        } else {
          console.error('InvoiceXpress error:', await invoiceResponse.text());
          invoicingStatus = 'error';
        }
      } catch (apiError) {
        console.error('InvoiceXpress API error:', apiError);
        invoicingStatus = 'error';
      }
    }

    // Create invoice record
    const invoiceRecord = {
      invoice_number: invoiceNumber,
      invoice_type: 'professional_receipt',
      booking_id: booking_id,
      professional_email: professionalEmail,
      professional_name: booking.walker_name || booking.trainer_name,
      professional_tax_id: taxData.tax_id,
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
      status: invoicingStatus,
      external_invoice_id: externalInvoiceId,
      pdf_url: pdfUrl,
      pdf_expiry: pdfUrl ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      invoicing_software: INVOICEXPRESS_API_KEY ? 'invoicexpress' : 'manual',
      issued_at: new Date().toISOString()
    };

    // Delete existing if force regenerate
    if (existingInvoices.length > 0 && force_regenerate) {
      await base44.asServiceRole.entities.Invoice.delete(existingInvoices[0].id);
    }

    const createdInvoice = await base44.asServiceRole.entities.Invoice.create(invoiceRecord);

    // Send notification to professional
    await base44.asServiceRole.entities.Notification.create({
      recipient_email: professionalEmail,
      title: '📄 Fatura Gerada',
      message: `Fatura ${invoiceNumber} gerada para o serviço de ${serviceDate}. Valor líquido: €${netAmount.toFixed(2)}`,
      type: 'system',
      related_id: createdInvoice.id,
      priority: 'normal',
      action_url: '/FiscalSettings'
    });

    return Response.json({
      success: true,
      invoice: createdInvoice
    });

  } catch (error) {
    console.error('Generate invoice error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});