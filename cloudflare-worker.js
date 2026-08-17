/* ============================================================
   AnyAPI Chat — Cloudflare Worker (CORS proxy)  v2
   ------------------------------------------------------------
   - همیشه هدرهای CORS را برمی‌گرداند (حتی روی خطا) تا مرورگر
     هیچ‌وقت با «شبکه/CORS» رد نکند.
   - هدرهای preflight را بازتاب می‌دهد (هر هدر سفارشی مثل توکن
     امنیتی بدون مشکل عبور می‌کند).
   - اگر سرور مقصد صفحه‌ی HTML/فایروال (WAF) برگرداند، یک خطای
     واضح JSON می‌دهد به‌جای صفحه‌ی خام.
   - استریم چت حفظ می‌شود؛ هدرهای encoding حذف می‌شوند.

   استفاده در اپ → فیلد CORS Proxy:
       https://<your-worker>.workers.dev/?url={url}

   اختیاری: اگر می‌خواهی Worker فقط برای اپ خودت کار کند،
   PROXY_TOKEN را پر کن و همان مقدار را در «تنظیمات → توکن امنیتی
   Worker» اپ بگذار.
   ============================================================ */

const ALLOW_HOSTS = [
  'agentrouter.org',
  'api.bluesminds.com',
  // هاست سرورهای دیگرت را اینجا اضافه کن. خالی‌کردن آرایه = همه مجاز
];

const PROXY_TOKEN = ''; // اگر پر شود، درخواست باید هدر X-Proxy-Token برابر داشته باشد

function corsHeaders(request) {
  const reqHdrs = request.headers.get('Access-Control-Request-Headers');
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': reqHdrs || 'Authorization,Content-Type,X-Proxy-Token',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request) {
    const CORS = corsHeaders(request);
    const json = (obj, status) => new Response(JSON.stringify(obj), {
      status, headers: { 'Content-Type': 'application/json', ...CORS },
    });

    try {
      if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });

      if (PROXY_TOKEN && request.headers.get('X-Proxy-Token') !== PROXY_TOKEN) {
        return json({ error: 'invalid X-Proxy-Token' }, 401);
      }

      const reqUrl = new URL(request.url);
      const target = reqUrl.searchParams.get('url');
      if (!target) return json({ error: 'missing ?url=' }, 400);

      let t;
      try { t = new URL(target); } catch { return json({ error: 'bad url' }, 400); }
      if (ALLOW_HOSTS.length && !ALLOW_HOSTS.includes(t.hostname)) {
        return json({ error: 'host not allowed: ' + t.hostname }, 403);
      }

      const headers = new Headers();
      const auth = request.headers.get('Authorization');
      if (auth) headers.set('Authorization', auth);
      const ct = request.headers.get('Content-Type');
      if (ct) headers.set('Content-Type', ct);
      headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
      headers.set('Accept', 'application/json, text/event-stream, */*');
      headers.set('Accept-Language', 'en-US,en;q=0.9,fa;q=0.8');
      headers.set('Referer', t.origin + '/');
      headers.set('Origin', t.origin);

      const init = { method: request.method, headers, redirect: 'follow' };
      if (request.method === 'POST') init.body = await request.arrayBuffer();

      let resp;
      try { resp = await fetch(t.toString(), init); }
      catch (e) { return json({ error: 'upstream fetch failed: ' + e.message }, 502); }

      // اگر مقصد صفحه‌ی HTML/فایروال داد (نه API)، خطای واضح بده
      const upCt = resp.headers.get('content-type') || '';
      if (upCt.includes('text/html')) {
        return json({ error: 'upstream returned an HTML page (likely a WAF/anti-bot challenge), not the API. This server cannot be used from a browser/worker.' }, 502);
      }

      const outHeaders = new Headers(resp.headers);
      for (const [k, v] of Object.entries(CORS)) outHeaders.set(k, v);
      ['content-encoding', 'content-length', 'transfer-encoding', 'connection',
       'content-security-policy', 'content-security-policy-report-only'].forEach(h => outHeaders.delete(h));
      return new Response(resp.body, { status: resp.status, headers: outHeaders });

    } catch (e) {
      return json({ error: 'worker error: ' + (e && e.message || e) }, 500);
    }
  }
};
