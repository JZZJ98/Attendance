// api/go.ts — validates token and redirects to FormSG
import { kv } from '@vercel/kv';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) return new Response('Missing token', { status: 400 });

  const key = t:${token};
  const entry = await kv.get<string>(key);
  if (!entry) return new Response('Invalid or expired token', { status: 403 });

  const data = JSON.parse(entry);
  if (data.used) return new Response('Token already used', { status: 403 });

  // Mark used with a short grace period
  await kv.set(key, JSON.stringify({ …data, used: true }), { ex: 10 });

  const formsgUrl = process.env.FORMSGURL;
  if (!formsgUrl) return new Response('Missing FORMSGURL', { status: 500 });

  return new Response(null, {
    status: 302,
    headers: {
      'Location': formsgUrl,
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
    },
  });
}
