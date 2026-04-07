export const config = { runtime: 'edge' };

import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';
import { getCachedJson, setCachedJson } from './_upstash-cache.js';

const YF_CACHE_TTL = 60;
const SYMBOL_PATTERN = /^[A-Za-z0-9.^=\-]+$/;
const MAX_SYMBOL_LENGTH = 20;

function validateSymbol(symbol) {
  if (!symbol) return null;
  const trimmed = symbol.trim().toUpperCase();
  if (trimmed.length > MAX_SYMBOL_LENGTH) return null;
  if (!SYMBOL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export default async function handler(req) {
  const cors = getCorsHeaders(req);
  if (isDisallowedOrigin(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: cors });
  }
  const url = new URL(req.url);
  const symbol = validateSymbol(url.searchParams.get('symbol'));

  if (!symbol) {
    return new Response(JSON.stringify({ error: 'Invalid or missing symbol parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  const cacheKey = `yf:${symbol}`;
  try {
    const redisCached = await getCachedJson(cacheKey);
    if (redisCached) {
      return new Response(JSON.stringify(redisCached), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors, 'Cache-Control': `public, max-age=${YF_CACHE_TTL}, s-maxage=${YF_CACHE_TTL}, stale-while-revalidate=30` },
      });
    }
  } catch {}

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = await response.json();
    setCachedJson(cacheKey, data, YF_CACHE_TTL).catch(() => {});

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        ...cors,
        'Cache-Control': `public, max-age=${YF_CACHE_TTL}, s-maxage=${YF_CACHE_TTL}, stale-while-revalidate=30`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}
