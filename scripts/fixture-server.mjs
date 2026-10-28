import http from 'node:http';
const previewPort = Number(process.env.WIDGET_PLAYGROUND_PORT ?? 4310);
const port = Number(process.env.WIDGET_FIXTURE_PORT ?? previewPort + 1);
const allowedParents = new Set([
  `http://127.0.0.1:${previewPort}`,
  `http://localhost:${previewPort}`,
]);
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') {
    res.writeHead(200);
    res.end('local fixture');
    return;
  }
  const match = url.pathname.match(/^\/embed\/reservations\/([a-zA-Z0-9_-]{1,160})\/$/);
  const parentOrigin = url.searchParams.get('parentOrigin');
  if (!match || match[1] === 'unavailable' || !allowedParents.has(parentOrigin)) {
    res.writeHead(404);
    res.end('Fixture unavailable');
    return;
  }
  const modal = url.searchParams.get('mode') === 'modal';
  const config = JSON.stringify({ parentOrigin, modal, slow: match[1] === 'slow' }).replace(
    /</g,
    '\\u003c',
  );
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Security-Policy': `default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-ancestors ${[...allowedParents].join(' ')}`,
  });
  res.end(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MenüQR local reservation preview</title>
 <style>*{box-sizing:border-box}body{font:15px/1.55 system-ui,sans-serif;color:#202820;margin:0;background:#fcfcf8}main{padding:24px;max-width:600px;margin:auto}header{display:flex;justify-content:space-between;gap:12px;align-items:start}small{color:#66745c;font-size:12px}h1{font-size:26px;letter-spacing:-.8px;line-height:1.2;margin:8px 0 24px}h2{font-size:25px}label{display:block;color:#58694f;font-size:13px;margin:18px 0 8px}select,input{width:100%;border:1px solid #cdd7c4;border-radius:8px;padding:12px;font:inherit;background:white;color:#202820}button{font:inherit;cursor:pointer;border-radius:9px;padding:12px 16px;border:1px solid #cdd7c4;background:white;color:#202820;min-height:44px}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #b14c00;outline-offset:3px}.submit{width:100%;margin-top:24px;background:#202820;color:white;border-color:#202820}.close{width:40px;height:40px;min-height:40px;padding:0}.notice{border-top:1px solid #dbe2d4;margin-top:22px;padding-top:16px;font-size:12px;color:#607053}.times{display:flex;gap:8px}.times button{flex:1;font-size:13px;padding:10px}.times [aria-pressed=true]{border-color:#af4a00;box-shadow:inset 0 0 0 1px #af4a00}p{overflow-wrap:anywhere}[hidden]{display:none!important}</style>
 <main><header><div><small>Bistro Lumi · local fixture</small><h1>Reserve a table</h1></div><button type="button" class="close" id="close" aria-label="Close preview" ${modal ? '' : 'hidden'}>×</button></header>
 <form id="form"><label for="guests">Guests</label><select id="guests"><option>1 guest</option><option selected>2 guests</option><option>3 guests</option><option>4 guests</option></select><label for="date">Date</label><input id="date" type="date" required><label>Example times</label><div class="times"><button type="button" aria-pressed="false">18:30</button><button type="button" aria-pressed="true">19:00</button><button type="button" aria-pressed="false">19:30</button></div><button type="submit" class="submit">Preview request</button></form>
 <section id="receipt" aria-live="polite" hidden><h2>Preview only.</h2><p>Nothing has been sent. In production, the restaurant receives the request and decides whether to accept it.</p><button id="reset" type="button">Back to the form</button></section><p class="notice">Local sandbox. No real reservation, account, email or payment. This fixture checks the public iframe protocol, not production availability.</p></main>
 <script>const config=${config};const send=type=>parent.postMessage({type},config.parentOrigin);const date=document.querySelector('#date');const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);date.value=tomorrow.getFullYear()+'-'+String(tomorrow.getMonth()+1).padStart(2,'0')+'-'+String(tomorrow.getDate()).padStart(2,'0');document.querySelector('#close').onclick=()=>send('menueqr:reservation:close');document.querySelectorAll('.times button').forEach(button=>button.onclick=()=>document.querySelectorAll('.times button').forEach(item=>item.setAttribute('aria-pressed',String(item===button))));document.querySelector('#form').onsubmit=event=>{event.preventDefault();document.querySelector('#form').hidden=true;document.querySelector('#receipt').hidden=false;};document.querySelector('#reset').onclick=()=>{document.querySelector('#form').hidden=false;document.querySelector('#receipt').hidden=true;};setTimeout(()=>send('menueqr:reservation:ready'),config.slow?1500:0);</script></html>`);
});
server.listen(port, '127.0.0.1', () =>
  console.log(`Local iframe fixture: http://127.0.0.1:${port}`),
);
process.once('SIGTERM', () => server.close(() => process.exit(0)));
process.once('SIGINT', () => server.close(() => process.exit(0)));
