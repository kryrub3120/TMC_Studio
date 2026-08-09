/**
 * Health Check Endpoint
 * TMC Studio - Netlify Function
 * 
 * Simple endpoint to verify functions are working
 * GET /api/health
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export function resolveEnvironment(): 'production' | 'development' {
  return process.env.URL === 'https://tmcstudio.app'
    ? 'production'
    : 'development';
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: resolveEnvironment(),
    functions: {
      health: true,
      stripeWebhook: !!process.env.STRIPE_SECRET_KEY,
      supabase: !!process.env.SUPABASE_URL,
    },
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(response, null, 2),
  };
};

export { handler };
