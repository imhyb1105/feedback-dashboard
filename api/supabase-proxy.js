// Vercel 反向代理：将 /api/supabase/* 转发到 Supabase
var TARGET = 'https://xreszvclqxetfyhclgpw.supabase.co';

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'authorization, x-client-info, apikey, content-type, prefer');
  res.setHeader('access-control-allow-methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('access-control-max-age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'HEAD'].indexOf(req.method) === -1) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // 从 rewrite query param 获取 Supabase 子路径
  var rawPath = req.query.p;
  var supabasePath = Array.isArray(rawPath) ? rawPath.join('/') : (rawPath || '');

  // 手工重建查询参数
  var qsParts = [];
  var qKeys = Object.keys(req.query || {});
  for (var i = 0; i < qKeys.length; i++) {
    var k = qKeys[i];
    if (k === 'p') continue;
    var v = req.query[k];
    if (Array.isArray(v)) {
      for (var j = 0; j < v.length; j++) {
        qsParts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v[j]));
      }
    } else {
      qsParts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
  }
  var qsStr = qsParts.join('&');
  var targetUrl = TARGET + '/' + supabasePath;
  if (qsStr) targetUrl += '?' + qsStr;

  try {
    var forwardHeaders = {};
    var headerKeys = ['apikey', 'authorization', 'content-type', 'accept', 'prefer', 'x-client-info'];
    for (var hi = 0; hi < headerKeys.length; hi++) {
      var hn = headerKeys[hi];
      var hv = req.headers[hn];
      if (hv) forwardHeaders[hn] = hv;
    }

    var fetchOpts = { method: req.method, headers: forwardHeaders };
    if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOpts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    var upstream = await fetch(targetUrl, fetchOpts);
    var upstreamBody = await upstream.text();

    var resHeaders = {};
    upstream.headers.forEach(function(v, k) {
      var kl = k.toLowerCase();
      if (kl !== 'transfer-encoding' && kl !== 'connection' && kl !== 'keep-alive') {
        res.setHeader(k, v);
      }
    });
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', 'authorization, x-client-info, apikey, content-type, prefer');
    res.setHeader('cache-control', 'no-store');
    // Debug headers
    res.setHeader('x-proxy-target', targetUrl);
    res.setHeader('x-proxy-body-len', String(upstreamBody.length));

    // 直接写入响应，绕过 Vercel helper 可能的问题
    res.statusCode = upstream.status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(upstreamBody);
    return;
  } catch (e) {
    return res.status(502).json({
      error: 'Proxy error',
      message: e.message,
      target: targetUrl
    });
  }
};
