import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';
import { getCachedJson, setCachedJson } from './_upstash-cache.js';
export const config = { runtime: 'edge' };

const FRED_CACHE_TTL = 3600;

export default async function handler(req) {
  const corsHeaders = getCorsHeaders(req, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    if (isDisallowedOrigin(req)) {
      return new Response(null, { status: 403, headers: corsHeaders });
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  if (isDisallowedOrigin(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const url = new URL(req.url);
  const seriesId = url.searchParams.get('series_id');
  const observationStart = url.searchParams.get('observation_start');
  const observationEnd = url.searchParams.get('observation_end');

  if (!seriesId) {
    return new Response(JSON.stringify({ error: 'Missing series_id parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      observations: [],
      skipped: true,
      reason: 'FRED_API_KEY not configured',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
        ...corsHeaders,
      },
    });
  }

  const cacheKey = `fred:${seriesId}:${observationStart || ''}:${observationEnd || ''}`;
  try {
    const redisCached = await getCachedJson(cacheKey);
    if (redisCached) {
      return new Response(JSON.stringify(redisCached), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${FRED_CACHE_TTL}, s-maxage=${FRED_CACHE_TTL}, stale-while-revalidate=600`, ...corsHeaders },
      });
    }
  } catch {}

  try {
    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: apiKey,
      file_type: 'json',
      sort_order: 'desc',
      limit: '10',
    });

    if (observationStart) params.set('observation_start', observationStart);
    if (observationEnd) params.set('observation_end', observationEnd);

    const fredUrl = `https://api.stlouisfed.org/fred/series/observations?${params}`;
    const response = await fetch(fredUrl, {
      headers: { 'Accept': 'application/json' },
    });

    const data = await response.json();
    setCachedJson(cacheKey, data, FRED_CACHE_TTL).catch(() => {});

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${FRED_CACHE_TTL}, s-maxage=${FRED_CACHE_TTL}, stale-while-revalidate=600`,
        ...corsHeaders,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
