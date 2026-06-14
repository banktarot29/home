// api/config.js — public runtime config for optional integrations

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  return res.status(200).json({
    ok: true,
    lineUrl: 'https://lin.ee/qLCFQpj',
    kvReady: Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  });
}
