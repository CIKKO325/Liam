/** Netlify modern Function: browser POST /api/generate via netlify.toml rewrite. */
import generation from '../../api/generate.js';

const { validateBrief, runGeneration } = generation._test;

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: '仅支持 POST 请求。' }, 405);
  // Limit before parsing so requests cannot consume arbitrarily large amounts of memory.
  let raw;
  try { raw = await request.text(); }
  catch { return json({ error: '读取请求失败。' }, 400); }
  if (raw.length > 10000) return json({ error: '输入过长，请精简内容。' }, 413);
  let body;
  try { body = JSON.parse(raw); }
  catch { return json({ error: 'JSON 格式错误。' }, 400); }
  try {
    const brief = validateBrief(body);
    const report = await runGeneration(brief);
    return json({ report, generatedAt: new Date().toISOString(), model: process.env.AI_MODEL || 'deepseek-flash' });
  } catch (error) {
    const msg = String(error?.message || '生成失败，请稍后重试。');
    const badRequest = ['请填写', '输入格式', '请至少'].some(s => msg.startsWith(s));
    return json({ error: msg }, error?.statusCode || (badRequest ? 400 : 502));
  }
}
