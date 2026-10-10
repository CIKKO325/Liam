/** Netlify modern Function: browser GET /api/health via netlify.toml rewrite. */
export default async function handler(request) {
  if (request.method !== 'GET') return Response.json({error:'仅支持 GET 请求。'}, { status:405 });
  const configured = Boolean(process.env.AI_API_KEY && !process.env.AI_API_KEY.includes('替换成'));
  return Response.json({ configured, model: configured ? (process.env.AI_MODEL || 'deepseek-flash') : null }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
