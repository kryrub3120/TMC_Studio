/**
 * Health Check Endpoint
 * TMC Studio - Netlify Function
 * 
 * Simple endpoint to verify functions are working
 * GET /api/health
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import appPackage from '../../package.json';

export const APP_VERSION = appPackage.version;

export function resolveEnvironment(): 'production' | 'development' {
  return process.env.URL === 'https://tmcstudio.app'
    ? 'production'
    : 'development';
}

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const response = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
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
