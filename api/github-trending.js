export const config = { runtime: 'edge' };

import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';
import { getCachedJson, setCachedJson } from './_upstash-cache.js';

const GH_CACHE_TTL = 1800;

export default async function handler(request) {
  const cors = getCorsHeaders(request);
  if (isDisallowedOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: cors });
  }
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'python';
    const since = searchParams.get('since') || 'daily';
    const spoken_language = searchParams.get('spoken_language') || '';

    // Using GitHub trending API (unofficial)
    // Alternative: https://gh-trending-api.herokuapp.com/repositories
    const baseUrl = 'https://api.gitterapp.com/repositories';
    const queryParams = new URLSearchParams({
      language: language,
      since: since,
    });

    if (spoken_language) {
      queryParams.append('spoken_language_code', spoken_language);
    }

    const cacheKey = `github-trending:${language}:${since}:${spoken_language}`;
    try {
      const redisCached = await getCachedJson(cacheKey);
      if (redisCached) {
        return new Response(JSON.stringify(redisCached), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...cors, 'Cache-Control': `public, max-age=${GH_CACHE_TTL}, s-maxage=${GH_CACHE_TTL}, stale-while-revalidate=300` },
        });
      }
    } catch {}

    const apiUrl = `${baseUrl}?${queryParams.toString()}`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GlobalIntel/1.0 (Tech Tracker)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      // Fallback: try alternative API
      const fallbackUrl = `https://gh-trending-api.herokuapp.com/repositories/${language}?since=${since}`;
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!fallbackResponse.ok) {
        throw new Error(`GitHub trending API returned ${fallbackResponse.status}`);
      }

      const data = await fallbackResponse.json();
      setCachedJson(cacheKey, data, GH_CACHE_TTL).catch(() => {});
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...cors,
          'Cache-Control': `public, max-age=${GH_CACHE_TTL}, s-maxage=${GH_CACHE_TTL}, stale-while-revalidate=300`,
        },
      });
    }

    const data = await response.json();
    setCachedJson(cacheKey, data, GH_CACHE_TTL).catch(() => {});

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...cors,
        'Cache-Control': `public, max-age=${GH_CACHE_TTL}, s-maxage=${GH_CACHE_TTL}, stale-while-revalidate=300`,
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch GitHub trending data',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...cors,
        },
      }
    );
  }
}
