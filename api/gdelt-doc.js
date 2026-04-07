import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';
import { getCachedJson, setCachedJson, hashString } from './_upstash-cache.js';
export const config = { runtime: 'edge' };

const GDELT_CACHE_TTL = 300;
const MAX_RECORDS = 20;
const DEFAULT_RECORDS = 10;

export default async function handler(req) {
  const cors = getCorsHeaders(req);
  if (isDisallowedOrigin(req)) {
    return new Response(JSON.stringify({ error: 'Origin not allowed' }), { status: 403, headers: cors });
  }
  const url = new URL(req.url);
  const query = url.searchParams.get('query');
  const maxrecords = Math.min(
    parseInt(url.searchParams.get('maxrecords') || DEFAULT_RECORDS, 10),
    MAX_RECORDS
  );
  const timespan = url.searchParams.get('timespan') || '72h';

  if (!query || query.length < 2) {
    return new Response(JSON.stringify({ error: 'Query parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cacheKey = `gdelt-doc:${hashString(`${query}:${maxrecords}:${timespan}`)}`;
  try {
    const redisCached = await getCachedJson(cacheKey);
    if (redisCached) {
      return new Response(JSON.stringify(redisCached), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...cors, 'Cache-Control': `public, max-age=${GDELT_CACHE_TTL}, s-maxage=${GDELT_CACHE_TTL}, stale-while-revalidate=60` },
      });
    }
  } catch {}

  try {
    const gdeltUrl = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
    gdeltUrl.searchParams.set('query', query);
    gdeltUrl.searchParams.set('mode', 'artlist');
    gdeltUrl.searchParams.set('maxrecords', maxrecords.toString());
    gdeltUrl.searchParams.set('format', 'json');
    gdeltUrl.searchParams.set('sort', 'date');
    gdeltUrl.searchParams.set('timespan', timespan);

    const response = await fetch(gdeltUrl.toString());

    if (!response.ok) {
      throw new Error(`GDELT returned ${response.status}`);
    }

    const data = await response.json();

    const articles = (data.articles || []).map(article => ({
      title: article.title,
      url: article.url,
      source: article.domain || article.source?.domain,
      date: article.seendate,
      image: article.socialimage,
      language: article.language,
      tone: article.tone,
    }));

    const result = { articles, query };
    setCachedJson(cacheKey, result, GDELT_CACHE_TTL).catch(() => {});

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...cors,
        'Cache-Control': `public, max-age=${GDELT_CACHE_TTL}, s-maxage=${GDELT_CACHE_TTL}, stale-while-revalidate=60`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, articles: [] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
