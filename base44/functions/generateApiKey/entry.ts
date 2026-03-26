import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Generate API Key for Partner
 * Admin-only endpoint to create API keys for pet shop partners
 */

function generateSecureKey(prefix = 'pk'): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_EXPIRY_DAYS = 90;

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

    // Generate cryptographically secure API key
    const apiKey = generateSecureKey('pk_live');
    const apiKeyHash = await hashApiKey(apiKey);

    // Enforce expiry (default 90 days, max 365 days)
    const expiryDays = Math.min(expires_days || DEFAULT_EXPIRY_DAYS, 365);
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + expiryDays);
    const expiresAt = expDate.toISOString();

    // Default permissions
    const defaultPermissions = [
      'products:read',
      'services:read',
      'orders:read',
      'orders:write',
      'bookings:read',
      'bookings:write'
    ];

    // Store hashed key — the raw key is only returned once
    const keyRecord = await base44.asServiceRole.entities.PartnerApiKey.create({
      partner_id,
      partner_name: partner_name || 'Partner',
      api_key_hash: apiKeyHash,
      api_key_prefix: apiKey.substring(0, 12) + '...', // For identification in UI
      permissions: permissions || defaultPermissions,
      rate_limit_per_minute: 60,
      is_active: true,
      expires_at: expiresAt,
      created_by: user.email,
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
      error: 'Failed to generate API key'
    }, { status: 500 });
  }
});