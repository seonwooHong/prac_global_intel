import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';
import { getCachedJson, setCachedJson } from './_upstash-cache.js';

export const config = { runtime: 'edge' };

const CACHE_KEY = 'earthquakes:4.5_day:v1';
const CACHE_TTL = 300;

export default async function handler(request) {
  const cors = getCorsHeaders(request);
  if (isDisallowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: cors });
  }

  try {
    const redisCached = await getCachedJson(CACHE_KEY);
    if (redisCached) {
      return new Response(JSON.stringify(redisCached), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors, 'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=60` },
      });
    }
  } catch {}

  try {
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson',
      { headers: { 'Accept': 'application/json' } }
    );

    const data = await response.json();
    setCachedJson(CACHE_KEY, data, CACHE_TTL).catch(() => {});

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...cors,
        'Cache-Control': `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}
