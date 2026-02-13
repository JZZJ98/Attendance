Create api/token.ts:
// api/token.ts  — issues a short‑lived, one‑time token
import { kv } from '@vercel/kv';

// Generate random hex token
function randomToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  // OPTIONAL: In future, verify an HMAC or secret from your page here

  const token = randomToken(32);
  const ttlSeconds = Number(process.env.TOKENTTLSECONDS ?? '120');

  await kv.set(t:${token}, JSON.stringify({ used: false, iat: Date.now() }), { ex: ttlSeconds });

  return new Response(JSON.stringify({ token }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      …corsHeaders(),
    },
  });
}

function corsHeaders() {
  const originAllowed = process.env.ORIGIN_ALLOWED ?? '*';
  return {
    'Access-Control-Allow-Origin': originAllowed,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Vary': 'Origin',
  };
}
