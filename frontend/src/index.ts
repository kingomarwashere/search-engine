const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Dark (default) */
  :root {
    --bg: #0a0a0a; --surface: #111; --border: #222;
    --text: #e8e8e8; --muted: #666; --accent: #ff0099;
    --mark: rgba(255,0,153,0.2); --title: #fff;
    --footer-text: #333; --footer-link: #444; --snippet: #888; --peers: #444;
  }

  /* Light */
  html.light {
    --bg: #f4f4f4; --surface: #fff; --border: #ddd;
    --text: #111; --muted: #888; --accent: #cc007a;
    --mark: rgba(204,0,122,0.15); --title: #0a0a0a;
    --footer-text: #aaa; --footer-link: #999; --snippet: #555; --peers: #bbb;
  }

  body { background: var(--bg); color: var(--text); font-family: 'Roboto Mono', monospace; min-height: 100vh; transition: background .2s, color .2s; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { filter: brightness(1.15); }
  mark { background: var(--mark); color: inherit; padding: 0 2px; }

  /* Theme toggle */
  .theme-toggle {
    position: fixed; top: 16px; right: 16px;
    background: none; border: 1px solid var(--border);
    font-size: 16px; padding: 6px 10px; cursor: pointer; line-height: 1;
    transition: border-color .15s; z-index: 100;
  }
  .theme-toggle:hover { border-color: var(--accent); }

  /* Home page */
  .home { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 40px; }
  .home-brand { text-align: center; }
  .logo { font-size: 48px; font-weight: 700; letter-spacing: -1px; color: var(--title); line-height: 1; }
  .logo span { color: var(--accent); }
  .tagline { color: var(--muted); font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px; }

  /* Search bar */
  .search-form { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 580px; padding: 0 16px; }
  .search-input {
    width: 100%; background: var(--surface); border: 1px solid var(--border);
    border-radius: 0; padding: 14px 18px; font-size: 15px; color: var(--text);
    font-family: 'Roboto Mono', monospace; outline: none; transition: border-color .15s, background .2s;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-input::placeholder { color: var(--muted); }
  .search-btn {
    background: var(--accent); border: none; padding: 12px;
    color: #fff; font-size: 13px; font-weight: 700; font-family: 'Roboto Mono', monospace;
    letter-spacing: 2px; text-transform: uppercase; cursor: pointer; transition: filter .15s;
  }
  .search-btn:hover { filter: brightness(1.15); }

  /* Results page */
  .results-page { max-width: 720px; margin: 0 auto; padding: 0 16px 80px; }
  .results-header {
    display: flex; align-items: center; gap: 16px;
    padding: 20px 0; border-bottom: 1px solid var(--border); margin-bottom: 28px;
  }
  .results-logo { font-size: 20px; font-weight: 700; white-space: nowrap; color: var(--title); }
  .results-logo span { color: var(--accent); }

  /* AI answer card */
  .answer-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); padding: 15px 18px; margin: 0 0 24px; }
  .answer-card.hidden { display: none; }
  .answer-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 9px; }
  .answer-body { font-size: 14px; line-height: 1.65; color: var(--text); }
  .answer-body sup a { color: var(--accent); font-size: 10px; padding: 0 1px; text-decoration: none; }
  .answer-sources { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; }
  .answer-sources a { font-size: 11px; color: var(--muted); border: 1px solid var(--border); padding: 2px 7px; }
  .answer-sources a:hover { border-color: var(--accent); color: var(--accent); }
  .results-form { display: flex; gap: 8px; flex: 1; }
  .results-input {
    flex: 1; background: var(--surface); border: 1px solid var(--border);
    border-radius: 0; padding: 9px 14px; font-size: 14px; color: var(--text);
    font-family: 'Roboto Mono', monospace; outline: none; transition: border-color .15s, background .2s;
  }
  .results-input:focus { border-color: var(--accent); }
  .results-btn {
    background: var(--accent); border: none; padding: 9px 18px;
    color: #fff; font-size: 12px; font-weight: 700; font-family: 'Roboto Mono', monospace;
    letter-spacing: 1px; text-transform: uppercase; cursor: pointer; white-space: nowrap;
  }
  .results-btn:hover { filter: brightness(1.15); }
  .meta { color: var(--muted); font-size: 12px; margin-bottom: 28px; letter-spacing: 0.5px; }
  .result { margin-bottom: 32px; border-left: 2px solid transparent; padding-left: 16px; transition: border-color .15s; }
  .result:hover { border-left-color: var(--accent); }
  .result-url { font-size: 11px; color: var(--muted); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.5px; }
  .result-title { font-size: 17px; font-weight: 500; line-height: 1.4; margin-bottom: 6px; }
  .result-title a { color: var(--title); }
  .result-title a:hover { color: var(--accent); }
  .result-snippet { font-size: 13px; color: var(--snippet); line-height: 1.7; }
  .pagination { display: flex; gap: 8px; margin-top: 40px; }
  .page-btn {
    background: var(--surface); border: 1px solid var(--border);
    padding: 8px 16px; color: var(--muted); font-size: 12px; font-family: 'Roboto Mono', monospace;
    letter-spacing: 1px; text-transform: uppercase; text-decoration: none; display: inline-block;
    transition: border-color .15s, color .15s;
  }
  .page-btn:hover { border-color: var(--accent); color: var(--accent); }
  .no-results { text-align: center; padding: 80px 20px; color: var(--muted); font-size: 13px; line-height: 2; }
  .peers { color: var(--peers); margin-left: 8px; }
  .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--footer-text); letter-spacing: 1px; }
  .footer a { color: var(--footer-link); }
  .footer a:hover { color: var(--accent); }
`

const THEME_JS = `
  (function() {
    var t = localStorage.getItem('theme');
    if (t === 'light') document.documentElement.classList.add('light');
  })();
  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('theme-toggle');
    function update() {
      var light = document.documentElement.classList.contains('light');
      btn.textContent = light ? '☀️' : '🌙';
    }
    update();
    btn.addEventListener('click', function() {
      document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
      update();
    });
  });
`

// On-brand favicon: dark tile, white "R", accent-pink underscore (the logo mark).
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <text x="16" y="21.5" font-family="'Roboto Mono',ui-monospace,monospace" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle">R</text>
  <rect x="9" y="24" width="14" height="3" rx="1" fill="#ff0099"/>
</svg>`

function layout(title: string, body: string) {
  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <style>${CSS}</style>
    <script>${THEME_JS}</script>
  </head><body>
    <button class="theme-toggle" id="theme-toggle">🌙</button>
    ${body}
  </body></html>`
}

function homePage(q = '') {
  return layout('Radical Search', `
    <div class="home">
      <div class="home-brand">
        <div class="logo">RADICAL<span>_</span>SEARCH</div>
        <div class="tagline">The open web &mdash; unfiltered</div>
      </div>
      <form class="search-form" action="/search" method="get">
        <input class="search-input" name="q" type="search" placeholder="what are you looking for?" value="${esc(q)}" autofocus>
        <button class="search-btn" type="submit">Search the web</button>
      </form>
    </div>
  `)
}

function resultsPage(q: string, data: any, page: number) {
  const hits = data.hits ?? []
  const total = data.total ?? 0
  const peers = data.peers ?? []

  const results = hits.length
    ? hits.map((h: any) => {
        const title = h._formatted?.title || h.title || h.domain
        const snippet = h._formatted?.description || h.description || ''
        return `
          <div class="result">
            <div class="result-url">${esc(h.url)}</div>
            <div class="result-title"><a href="${esc(h.url)}" rel="noopener">${title}</a></div>
            ${snippet ? `<div class="result-snippet">${snippet}</div>` : ''}
          </div>`
      }).join('')
    : `<div class="no-results">no results for &ldquo;<strong style="color:var(--title)">${esc(q)}</strong>&rdquo;<br>the index is still growing &mdash; try again soon</div>`

  const prevLink = page > 0 ? `<a class="page-btn" href="/search?q=${encodeURIComponent(q)}&page=${page - 1}">&larr; prev</a>` : ''
  const nextLink = hits.length === 10 ? `<a class="page-btn" href="/search?q=${encodeURIComponent(q)}&page=${page + 1}">next &rarr;</a>` : ''

  return layout(`${esc(q)} — Radical Search`, `
    <div class="results-page">
      <div class="results-header">
        <a class="results-logo" href="/">RADICAL<span>_</span>SEARCH</a>
        <form class="results-form" action="/search" method="get">
          <input class="results-input" name="q" type="search" value="${esc(q)}" autofocus>
          <button class="results-btn" type="submit">Go</button>
        </form>
      </div>
      <div class="meta">
        ~${total.toLocaleString()} results
        ${peers.length ? `<span class="peers">// ${peers.length} peer${peers.length !== 1 ? 's' : ''} federated</span>` : ''}
      </div>
      <div class="answer-card hidden" id="answer">
        <div class="answer-label">✦ AI answer</div>
        <div class="answer-body" id="answer-body"></div>
        <div class="answer-sources" id="answer-sources"></div>
      </div>
      <script>
        (function () {
          var q = ${JSON.stringify(q)};
          var card = document.getElementById('answer'),
              body = document.getElementById('answer-body'),
              srcEl = document.getElementById('answer-sources');
          function esc(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
          fetch('/api/answer?q=' + encodeURIComponent(q))
            .then(function (r) { return r.json(); })
            .then(function (d) {
              if (!d || !d.answer) return;
              var srcs = d.sources || [];
              var html = esc(d.answer).replace(/\\[(\\d+)\\]/g, function (m, n) {
                var s = srcs[parseInt(n) - 1];
                return s ? '<sup><a href="' + esc(s.url) + '" rel="noopener" title="' + esc(s.domain) + '">[' + n + ']</a></sup>' : '';
              });
              body.innerHTML = html;
              srcEl.innerHTML = srcs.map(function (s) {
                return '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.domain) + '</a>';
              }).join('');
              card.classList.remove('hidden');
            })
            .catch(function () {});
        })();
      </script>
      ${results}
      ${hits.length ? `<div class="pagination">${prevLink}${nextLink}</div>` : ''}
      <div class="footer">
        <a href="https://theradicalparty.com">theradicalparty.com</a>
        &nbsp;&mdash;&nbsp;
        ${(data.nodeId ?? 'main')} node
      </div>
    </div>
  `)
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default {
  async fetch(req: Request, env: { API_URL: string }) {
    const url = new URL(req.url)

    if (url.pathname === '/favicon.svg' || url.pathname === '/favicon.ico') {
      return new Response(FAVICON, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }

    if (url.pathname === '/') {
      // Accept a query on the root too (e.g. /?q=what) — redirect to the
      // canonical results URL so the search actually runs.
      const q = url.searchParams.get('q')?.trim()
      if (q) {
        const page = url.searchParams.get('page')
        const dest = `/search?q=${encodeURIComponent(q)}${page ? `&page=${encodeURIComponent(page)}` : ''}`
        return Response.redirect(url.origin + dest, 302)
      }
      return new Response(homePage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    }

    if (url.pathname === '/search') {
      const q = url.searchParams.get('q')?.trim() ?? ''
      if (!q) return Response.redirect(url.origin, 302)

      const page = Math.max(0, parseInt(url.searchParams.get('page') ?? '0'))

      try {
        const apiRes = await fetch(
          `${env.API_URL}/search?q=${encodeURIComponent(q)}&page=${page}`,
          { headers: { 'User-Agent': 'SearchFrontend/1.0' } }
        )
        const data = await apiRes.json() as any
        return new Response(resultsPage(q, data, page), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      } catch (e: any) {
        return new Response(resultsPage(q, { hits: [], total: 0 }, page), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })
      }
    }

    // Proxy API calls through (for stats, peers, etc.)
    if (url.pathname.startsWith('/api/')) {
      const apiPath = url.pathname.replace('/api', '')
      const apiRes = await fetch(`${env.API_URL}${apiPath}${url.search}`)
      return apiRes
    }

    return new Response('Not found', { status: 404 })
  }
}
