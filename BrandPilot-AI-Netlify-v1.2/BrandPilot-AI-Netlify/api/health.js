'use strict';

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: '仅支持 GET 请求。' });
  const configured = Boolean(process.env.AI_API_KEY && !process.env.AI_API_KEY.includes('替换成'));
  return res.status(200).json({ configured, model: configured ? (process.env.AI_MODEL || 'deepseek-flash') : null });
};
