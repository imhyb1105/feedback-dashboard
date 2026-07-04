// Vercel Cron Job: 每 5 天 ping Supabase 防止免费项目暂停
// 触发: Vercel Cron (配置在 vercel.json)
module.exports = async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xreszvclqxetfyhclgpw.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZXN6dmNscXhldGZ5aGNsZ3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMzU3MzYsImV4cCI6MjA5ODcxMTczNn0.zrHVe87P9DpsTWrkaClCnlr0yTz2rgmrwfHnOTwsb8A';

  try {
    const r1 = await fetch(`${SUPABASE_URL}/rest/v1/feedbacks?limit=1`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const r2 = await fetch(`${SUPABASE_URL}/rest/v1/usage_events?limit=1`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });

    const status = {
      feedbacks: r1.status,
      usage_events: r2.status,
      time: new Date().toISOString()
    };

    console.log('Keep-alive OK:', JSON.stringify(status));
    return res.status(200).json({ ok: true, status });
  } catch (e) {
    console.error('Keep-alive failed:', e.message);
    return res.status(500).json({ ok: false, error: e.message });
  }
}
