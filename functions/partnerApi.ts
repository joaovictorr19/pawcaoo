import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * PawCão Partner API v1
 * RESTful API for pet shop partner integrations
 * 
 * Authentication: Bearer token (API Key)
 * Header: Authorization: Bearer <api_key>
 * 
 * Endpoints:
 * GET    /products         - List products
 * GET    /products/:id     - Get product details
 * GET    /services         - List services
 * GET    /services/:id     - Get service details
 * POST   /orders           - Create order
 * GET    /orders           - List orders
 * GET    /orders/:id       - Get order details
 * PATCH  /orders/:id       - Update order status
 * POST   /bookings         - Create service booking
 * GET    /bookings         - List bookings
 */

// Helper: Parse path from URL
const parsePath = (url) => {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  // Remove function name from path
  const apiPath = pathParts.slice(1); // ['products'] or ['products', 'id']
  return {
    resource: apiPath[0] || '',
    id: apiPath[1] || null,
    query: Object.fromEntries(urlObj.searchParams)
  };
};

// Helper: JSON Response
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
};

// Helper: Error Response
const errorResponse = (message, status = 400, code = 'BAD_REQUEST') => {
  return jsonResponse({
    success: false,
    error: {
      code,
      message
    }
  }, status);
};

// Validate API Key and get permissions
const validateApiKey = async (base44, apiKey) => {
  if (!apiKey) {
    return { valid: false, error: 'API key required' };
  }

  try {
    const keys = await base44.asServiceRole.entities.PartnerApiKey.filter({
      api_key: apiKey,
      is_active: true
    });

    if (!keys || keys.length === 0) {
      return { valid: false, error: 'Invalid or inactive API key' };
    }

    const keyData = keys[0];

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key expired' };
    }

    // Update last used
    await base44.asServiceRole.entities.PartnerApiKey.update(keyData.id, {
      last_used_at: new Date().toISOString(),
      request_count: (keyData.request_count || 0) + 1
    });

    return {
      valid: true,
      partnerId: keyData.partner_id,
      partnerName: keyData.partner_name,
      permissions: keyData.permissions || []
    };
  } catch (err) {
    console.error('API Key validation error:', err);
    return { valid: false, error: 'Authentication error' };
  }
};

// Check permission
const hasPermission = (permissions, required) => {
  return permissions.includes(required) || permissions.includes('*');
};

// Products handlers
const handleProducts = async (base44, method, id, query, body, permissions) => {
  if (method === 'GET') {
    if (!hasPermission(permissions, 'products:read')) {
      return errorResponse('Permission denied: products:read required', 403, 'FORBIDDEN');
    }

    if (id) {
      // Get single product
      const products = await base44.asServiceRole.entities.PartnerProduct.filter({ id });
      if (!products || products.length === 0) {
        return errorResponse('Product not found', 404, 'NOT_FOUND');
      }
      return jsonResponse({ success: true, data: products[0] });
    }

    // List products
    const limit = parseInt(query.limit) || 50;
    const skip = parseInt(query.skip) || 0;
    const category = query.category;
    const search = query.search;

    let filter = { is_active: true };
    if (category) filter.category = category;

    const products = await base44.asServiceRole.entities.PartnerProduct.filter(
      filter, 
      '-created_date', 
      limit
    );

    // Apply search filter if provided
    let filtered = products;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = products.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    return jsonResponse({
      success: true,
      data: filtered.slice(skip, skip + limit),
      pagination: {
        total: filtered.length,
        limit,
        skip,
        hasMore: filtered.length > skip + limit
      }
    });
  }

  return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
};

// Services handlers
const handleServices = async (base44, method, id, query, body, permissions) => {
  if (method === 'GET') {
    if (!hasPermission(permissions, 'services:read')) {
      return errorResponse('Permission denied: services:read required', 403, 'FORBIDDEN');
    }

    if (id) {
      const services = await base44.asServiceRole.entities.PartnerService.filter({ id });
      if (!services || services.length === 0) {
        return errorResponse('Service not found', 404, 'NOT_FOUND');
      }
      return jsonResponse({ success: true, data: services[0] });
    }

    const limit = parseInt(query.limit) || 50;
    const partnerId = query.partner_id;

    let filter = { is_active: true };
    if (partnerId) filter.partner_id = partnerId;

    const services = await base44.asServiceRole.entities.PartnerService.filter(
      filter,
      '-created_date',
      limit
    );

    return jsonResponse({
      success: true,
      data: services,
      pagination: { total: services.length, limit }
    });
  }

  return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
};

// Orders handlers
const handleOrders = async (base44, method, id, query, body, permissions, partnerId) => {
  if (method === 'GET') {
    if (!hasPermission(permissions, 'orders:read')) {
      return errorResponse('Permission denied: orders:read required', 403, 'FORBIDDEN');
    }

    if (id) {
      const orders = await base44.asServiceRole.entities.PartnerOrder.filter({ 
        id,
        partner_id: partnerId 
      });
      if (!orders || orders.length === 0) {
        return errorResponse('Order not found', 404, 'NOT_FOUND');
      }
      return jsonResponse({ success: true, data: orders[0] });
    }

    // List orders for this partner with advanced filtering
    const limit = parseInt(query.limit) || 50;
    const status = query.status;
    const customerEmail = query.customer_email;
    const externalOrderId = query.external_order_id;
    const startDate = query.start_date;
    const endDate = query.end_date;
    const exportFormat = query.export; // csv or json

    let filter = { partner_id: partnerId };
    if (status) filter.status = status;
    if (customerEmail) filter.customer_email = customerEmail;
    if (externalOrderId) filter.external_order_id = externalOrderId;

    const orders = await base44.asServiceRole.entities.PartnerOrder.filter(
      filter,
      '-created_date',
      limit
    );

    // Apply date range filtering
    let filtered = orders;
    if (startDate || endDate) {
      filtered = orders.filter(order => {
        const orderDate = new Date(order.created_date);
        if (startDate && orderDate < new Date(startDate)) return false;
        if (endDate && orderDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Export as CSV if requested
    if (exportFormat === 'csv') {
      const csvHeaders = ['Order ID', 'External ID', 'Customer', 'Email', 'Total', 'Status', 'Payment', 'Date'];
      const csvRows = filtered.map(o => [
        o.order_id,
        o.external_order_id || '',
        o.customer_name || '',
        o.customer_email,
        o.total_amount?.toFixed(2) || '0.00',
        o.status,
        o.payment_status,
        new Date(o.created_date).toISOString()
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders_${Date.now()}.csv"`,
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return jsonResponse({
      success: true,
      data: filtered,
      pagination: { 
        total: filtered.length, 
        limit,
        filters_applied: {
          status: status || null,
          customer_email: customerEmail || null,
          external_order_id: externalOrderId || null,
          date_range: startDate || endDate ? { start: startDate, end: endDate } : null
        }
      }
    });
  }

  if (method === 'POST') {
    if (!hasPermission(permissions, 'orders:write')) {
      return errorResponse('Permission denied: orders:write required', 403, 'FORBIDDEN');
    }

    // Validate required fields
    if (!body.customer_email || !body.items || body.items.length === 0) {
      return errorResponse('customer_email and items are required', 400, 'VALIDATION_ERROR');
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = body.items.map(item => {
      const itemTotal = (item.quantity || 1) * (item.unit_price || 0);
      subtotal += itemTotal;
      return {
        ...item,
        total_price: itemTotal
      };
    });

    const discount = body.discount || 0;
    const shippingFee = body.shipping_fee || 0;
    const totalAmount = subtotal - discount + shippingFee;

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order = await base44.asServiceRole.entities.PartnerOrder.create({
      order_id: orderId,
      external_order_id: body.external_order_id,
      partner_id: partnerId,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      items: processedItems,
      subtotal,
      discount,
      shipping_fee: shippingFee,
      total_amount: totalAmount,
      status: 'pending',
      payment_status: body.payment_status || 'pending',
      payment_method: body.payment_method,
      shipping_address: body.shipping_address,
      notes: body.notes,
      metadata: body.metadata
    });

    return jsonResponse({
      success: true,
      data: order,
      message: 'Order created successfully'
    }, 201);
  }

  if (method === 'PATCH') {
    if (!hasPermission(permissions, 'orders:write')) {
      return errorResponse('Permission denied: orders:write required', 403, 'FORBIDDEN');
    }

    if (!id) {
      return errorResponse('Order ID required', 400, 'VALIDATION_ERROR');
    }

    // Verify order belongs to partner
    const orders = await base44.asServiceRole.entities.PartnerOrder.filter({
      id,
      partner_id: partnerId
    });

    if (!orders || orders.length === 0) {
      return errorResponse('Order not found', 404, 'NOT_FOUND');
    }

    const currentOrder = orders[0];

    // Only allow updating specific fields
    const allowedUpdates = ['status', 'payment_status', 'tracking_number', 'notes', 'metadata'];
    const updates = {};
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    const updated = await base44.asServiceRole.entities.PartnerOrder.update(id, updates);

    // Send webhook notification if status changed and webhook URL configured
    if (updates.status && updates.status !== currentOrder.status) {
      try {
        const apiKeys = await base44.asServiceRole.entities.PartnerApiKey.filter({ partner_id: partnerId });
        if (apiKeys[0]?.webhook_url) {
          // Fire and forget webhook call
          fetch(apiKeys[0].webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'order.status_updated',
              order_id: updated.order_id,
              external_order_id: updated.external_order_id,
              old_status: currentOrder.status,
              new_status: updated.status,
              tracking_number: updated.tracking_number,
              timestamp: new Date().toISOString()
            })
          }).catch(err => console.error('Webhook failed:', err));
        }
      } catch (e) {
        console.error('Webhook notification error:', e);
      }
    }

    return jsonResponse({
      success: true,
      data: updated,
      message: 'Order updated successfully'
    });
  }

  return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
};

// Bookings handlers
const handleBookings = async (base44, method, id, query, body, permissions, partnerId) => {
  if (method === 'GET') {
    if (!hasPermission(permissions, 'bookings:read')) {
      return errorResponse('Permission denied: bookings:read required', 403, 'FORBIDDEN');
    }

    if (id) {
      const bookings = await base44.asServiceRole.entities.ServiceBooking.filter({ 
        id,
        partner_id: partnerId 
      });
      if (!bookings || bookings.length === 0) {
        return errorResponse('Booking not found', 404, 'NOT_FOUND');
      }
      return jsonResponse({ success: true, data: bookings[0] });
    }

    const limit = parseInt(query.limit) || 50;
    const status = query.status;

    let filter = { partner_id: partnerId };
    if (status) filter.status = status;

    const bookings = await base44.asServiceRole.entities.ServiceBooking.filter(
      filter,
      '-created_date',
      limit
    );

    return jsonResponse({
      success: true,
      data: bookings,
      pagination: { total: bookings.length, limit }
    });
  }

  if (method === 'POST') {
    if (!hasPermission(permissions, 'bookings:write')) {
      return errorResponse('Permission denied: bookings:write required', 403, 'FORBIDDEN');
    }

    if (!body.service_id || !body.customer_email || !body.booking_date) {
      return errorResponse('service_id, customer_email and booking_date are required', 400, 'VALIDATION_ERROR');
    }

    const booking = await base44.asServiceRole.entities.ServiceBooking.create({
      partner_id: partnerId,
      service_id: body.service_id,
      service_name: body.service_name,
      customer_email: body.customer_email,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      pet_name: body.pet_name,
      pet_type: body.pet_type,
      booking_date: body.booking_date,
      booking_time: body.booking_time,
      duration_minutes: body.duration_minutes,
      price: body.price,
      status: 'pending',
      notes: body.notes,
      metadata: body.metadata
    });

    return jsonResponse({
      success: true,
      data: booking,
      message: 'Booking created successfully'
    }, 201);
  }

  return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);

    // Extract API key from Authorization header
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '').trim();

    // Validate API key
    const auth = await validateApiKey(base44, apiKey);
    if (!auth.valid) {
      return errorResponse(auth.error, 401, 'UNAUTHORIZED');
    }

    // Parse request
    const { resource, id, query } = parsePath(req.url);
    const method = req.method;
    
    let body = {};
    if (method === 'POST' || method === 'PATCH') {
      try {
        body = await req.json();
      } catch (e) {
        body = {};
      }
    }

    // Route to handlers
    switch (resource) {
      case 'products':
        return await handleProducts(base44, method, id, query, body, auth.permissions);
      
      case 'services':
        return await handleServices(base44, method, id, query, body, auth.permissions);
      
      case 'orders':
        return await handleOrders(base44, method, id, query, body, auth.permissions, auth.partnerId);
      
      case 'bookings':
        return await handleBookings(base44, method, id, query, body, auth.permissions, auth.partnerId);
      
      case 'health':
        return jsonResponse({
          success: true,
          message: 'PawCão Partner API v1',
          timestamp: new Date().toISOString(),
          partner: auth.partnerName
        });
      
      default:
        return jsonResponse({
          success: true,
          message: 'PawCão Partner API v1',
          endpoints: {
            'GET /products': 'List products',
            'GET /products/:id': 'Get product details',
            'GET /services': 'List services',
            'GET /services/:id': 'Get service details',
            'POST /orders': 'Create order',
            'GET /orders': 'List orders',
            'GET /orders/:id': 'Get order details',
            'PATCH /orders/:id': 'Update order status',
            'POST /bookings': 'Create service booking',
            'GET /bookings': 'List bookings',
            'GET /health': 'API health check'
          },
          documentation: 'https://pawcao.net/api-docs'
        });
    }

  } catch (error) {
    console.error('Partner API Error:', error);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR');
  }
});