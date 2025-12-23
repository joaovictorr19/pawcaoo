import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate API Key for Partner
 * Admin-only endpoint to create API keys for pet shop partners
 */

const generateSecureKey = (prefix = 'pk') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = prefix + '_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin user
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Unauthorized - Admin access required' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { partner_id, partner_name, permissions, expires_days } = body;

    if (!partner_id) {
      return Response.json({
        success: false,
        error: 'partner_id is required'
      }, { status: 400 });
    }

    // Generate API key
    const apiKey = generateSecureKey('pk_live');

    // Calculate expiration if provided
    let expiresAt = null;
    if (expires_days) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + expires_days);
      expiresAt = expDate.toISOString();
    }

    // Default permissions
    const defaultPermissions = [
      'products:read',
      'services:read',
      'orders:read',
      'orders:write',
      'bookings:read',
      'bookings:write'
    ];

    // Create API key record
    const keyRecord = await base44.asServiceRole.entities.PartnerApiKey.create({
      partner_id,
      partner_name: partner_name || 'Partner',
      api_key: apiKey,
      permissions: permissions || defaultPermissions,
      rate_limit_per_minute: 60,
      is_active: true,
      expires_at: expiresAt,
      request_count: 0
    });

    return Response.json({
      success: true,
      data: {
        id: keyRecord.id,
        api_key: apiKey,
        partner_id,
        partner_name,
        permissions: keyRecord.permissions,
        expires_at: expiresAt,
        message: 'Store this API key securely - it will not be shown again!'
      }
    }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Generate API Key Error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
});