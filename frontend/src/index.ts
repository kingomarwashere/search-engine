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

  /* ── Smart panel: instant answers, knowledge panel, related ── */
  .smart-panel { display: flex; flex-direction: column; gap: 16px; margin: 0 0 24px; }
  .smart-panel:empty { display: none; }
  .iwidget { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); padding: 16px 18px; }
  .iwidget-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
  .iwidget-main { font-size: 28px; font-weight: 700; color: var(--title); line-height: 1.15; word-break: break-word; }
  .iwidget-sub { font-size: 12px; color: var(--muted); margin-top: 6px; }
  .clock-row { display: flex; flex-wrap: wrap; gap: 22px 32px; }
  .clock-time { font-size: 26px; font-weight: 700; color: var(--title); font-variant-numeric: tabular-nums; line-height: 1.1; }
  .clock-place { font-size: 11px; color: var(--accent); text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
  .clock-date { font-size: 11px; color: var(--snippet); margin-top: 2px; }
  .weather-row { display: flex; align-items: center; gap: 16px; }
  /* Force a colour-emoji font — the Roboto Mono webfont otherwise claims some
     weather glyphs (e.g. 🌤️) and renders them as tofu/missing. */
  .weather-emoji { font-size: 44px; line-height: 1; font-family: 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Twemoji Mozilla',sans-serif; }
  .weather-temp { font-size: 34px; font-weight: 700; color: var(--title); }
  .weather-meta { font-size: 12px; color: var(--muted); line-height: 1.7; }
  .dict-pos { color: var(--accent); font-style: italic; font-size: 12px; margin-right: 6px; }
  .dict-def { font-size: 13px; color: var(--text); line-height: 1.6; margin: 3px 0 9px; }
  .dict-phon { font-size: 12px; color: var(--muted); margin-left: 8px; }

  /* Aviation (METAR/TAF) */
  .avn-head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .avn-name { font-size: 15px; font-weight: 700; color: var(--title); }
  .avn-cat { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 3px; letter-spacing: 1px; }
  .avn-decoded { display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 12px; color: var(--muted); margin: 11px 0 4px; }
  .avn-decoded b { color: var(--text); font-weight: 500; }
  .avn-raw-label { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); margin: 10px 0 3px; }
  .avn-raw { font-size: 12px; color: var(--snippet); background: var(--bg); border: 1px solid var(--border); padding: 8px 10px; white-space: pre-wrap; word-break: break-word; line-height: 1.55; }

  /* Wikipedia knowledge panel */
  .kp { background: var(--surface); border: 1px solid var(--border); padding: 16px 18px; display: flex; gap: 16px; align-items: flex-start; }
  .kp-thumb { flex-shrink: 0; }
  .kp-thumb img { width: 92px; height: 92px; object-fit: cover; border: 1px solid var(--border); display: block; }
  .kp-body { min-width: 0; }
  .kp-title { font-size: 16px; font-weight: 700; color: var(--title); }
  .kp-desc { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 1.5px; margin: 2px 0 9px; }
  .kp-extract { font-size: 13px; line-height: 1.65; color: var(--snippet); }
  .kp-link { font-size: 11px; margin-top: 10px; display: inline-block; letter-spacing: 1px; text-transform: uppercase; }

  /* Related searches */
  .related { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .related-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); width: 100%; margin-bottom: 2px; }
  .related a { font-size: 12px; color: var(--muted); border: 1px solid var(--border); padding: 5px 12px; border-radius: 999px; transition: border-color .15s, color .15s; }
  .related a:hover { border-color: var(--accent); color: var(--accent); }
  /* Extra widgets: dev tools, nerd data, rich cards, markets */
  .iwidget-rows { display: grid; grid-template-columns: auto 1fr; gap: 5px 16px; font-size: 13px; margin-top: 11px; }
  .iwidget-rows dt { color: var(--muted); }
  .iwidget-rows dd { color: var(--text); margin: 0; word-break: break-word; }
  .mono { font-family: 'Roboto Mono', ui-monospace, monospace; }
  .iwidget-main.mono { font-size: 18px; word-break: break-all; }
  .color-swatch { display: inline-block; width: 18px; height: 18px; border-radius: 4px; border: 1px solid var(--border); vertical-align: middle; margin-left: 10px; }
  .list-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 8px 0; border-top: 1px solid var(--border); font-size: 13px; color: var(--text); }
  .list-row:first-of-type { border-top: 0; padding-top: 2px; }
  .mag { font-weight: 700; padding: 1px 7px; border-radius: 3px; font-size: 12px; }
  .up { color: #3fb950; } .down { color: #f85149; }
  .movie-card { display: flex; gap: 16px; }
  .movie-poster { width: 92px; height: 138px; object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
  @media (max-width: 480px) {
    .kp-thumb img { width: 64px; height: 64px; }
    .iwidget-main { font-size: 22px; }
    .movie-poster { width: 72px; height: 108px; }
  }
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

const SITE = 'https://search.theradicalparty.com'
const DESCRIPTION = 'RADICAL_SEARCH — an independent, self-hosted search engine for the open web. Unfiltered results, AI-powered answers, no tracking and no filter bubble.'

// On-brand favicon: dark tile, white "R", accent-pink underscore (the logo mark).
const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0a0a0a"/>
  <text x="16" y="21.5" font-family="'Roboto Mono',ui-monospace,monospace" font-size="20" font-weight="700" fill="#ffffff" text-anchor="middle">R</text>
  <rect x="9" y="24" width="14" height="3" rx="1" fill="#ff0099"/>
</svg>`

// 1200x630 social share card (Open Graph / Twitter).
const OG_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <text x="600" y="300" font-family="'Roboto Mono',ui-monospace,monospace" font-size="92" font-weight="700" fill="#ffffff" text-anchor="middle">RADICAL<tspan fill="#ff0099">_</tspan>SEARCH</text>
  <rect x="360" y="345" width="480" height="8" rx="4" fill="#ff0099"/>
  <text x="600" y="410" font-family="'Roboto Mono',ui-monospace,monospace" font-size="30" letter-spacing="6" fill="#666" text-anchor="middle">THE OPEN WEB — UNFILTERED</text>
</svg>`

// WebSite + SearchAction structured data → eligible for a Google sitelinks
// search box. Only emitted on the indexable homepage.
const JSON_LD = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'RADICAL_SEARCH',
  alternateName: 'Radical Search',
  url: SITE + '/',
  description: DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: SITE + '/search?q={search_term_string}' },
    'query-input': 'required name=search_term_string',
  },
})}</script>`

interface SeoOpts { canonical?: string; description?: string; noindex?: boolean; jsonLd?: boolean }

function layout(title: string, body: string, opts: SeoOpts = {}) {
  const desc = opts.description ?? DESCRIPTION
  const canonical = opts.canonical ?? SITE + '/'
  const robots = opts.noindex ? 'noindex, follow' : 'index, follow'
  return `<!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title>
    <meta name="description" content="${esc(desc)}">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${esc(canonical)}">
    <meta name="theme-color" content="#0a0a0a">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="RADICAL_SEARCH">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${esc(canonical)}">
    <meta property="og:image" content="${SITE}/og.svg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${SITE}/og.svg">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <style>${CSS}</style>
    <script>${THEME_JS}</script>
    ${opts.jsonLd ? JSON_LD : ''}
  </head><body>
    <button class="theme-toggle" id="theme-toggle">🌙</button>
    ${body}
    <script src="https://theradicalparty.com/footer.js" defer></script>
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
  `, { jsonLd: true, canonical: SITE + '/' })
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
      <div class="smart-panel" id="smart"></div>
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
          // Share one /instant fetch with the smart-panel script.
          var instantP = window.__instantP || (window.__instantP = fetch('/api/instant?q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).catch(function () { return null; }));
          instantP.then(function (inst) {
            // If a self-contained instant widget already answers the query, the
            // crawl-RAG answer is redundant (and often a "sources don't contain…"
            // non-answer over unrelated pages) — skip it entirely.
            var w = (inst && inst.widgets) || {};
            if (Object.keys(w).length) return;
            fetchAnswer();
          });
          function fetchAnswer() {
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
          }
        })();
      </script>
      <script>
        (function () {
          var q = ${JSON.stringify(q)};
          var el = document.getElementById('smart');
          if (!el) return;
          function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
          function attr(t){ return esc(t).replace(/"/g,'&quot;'); }
          function widget(label, inner){ return '<div class="iwidget"><div class="iwidget-label">' + esc(label) + '</div>' + inner + '</div>'; }
          function dictWidget(dd){
            var body = '<div class="iwidget-main" style="font-size:22px">' + esc(dd.word) + (dd.phonetic ? '<span class="dict-phon">' + esc(dd.phonetic) + '</span>' : '') + '</div>';
            (dd.meanings||[]).forEach(function(m){ (m.definitions||[]).forEach(function(def){
              body += '<div class="dict-def"><span class="dict-pos">' + esc(m.partOfSpeech) + '</span>' + esc(def) + '</div>';
            }); });
            return widget('Definition', body);
          }
          function weatherWidget(wx){
            var meta = 'Feels ' + esc(wx.feelsLike) + wx.unit + ' &middot; Humidity ' + esc(wx.humidity) + '% &middot; Wind ' + esc(wx.wind) + ' km/h';
            var inner = '<div class="weather-row"><div class="weather-emoji">' + esc(wx.emoji) + '</div><div><div class="weather-temp">' + esc(wx.temp) + wx.unit + '</div><div class="iwidget-sub">' + esc(wx.desc) + ' &middot; ' + esc(wx.place) + '</div></div></div><div class="weather-meta">' + meta + '</div>';
            return widget('Weather', inner);
          }
          function timeWidget(t){
            var row = '<div class="clock-row">';
            (t.zones||[]).forEach(function(z, i){
              row += '<div class="clock"><div class="clock-time" id="clk' + i + '">&mdash;</div><div class="clock-place">' + esc(z.label) + '</div><div class="clock-date" id="clkd' + i + '"></div></div>';
            });
            return row + '</div>';
          }
          function startClock(zones){
            function tick(){
              (zones||[]).forEach(function(z, i){
                var te = document.getElementById('clk' + i), de = document.getElementById('clkd' + i);
                if (!te) return;
                try {
                  te.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: z.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date());
                  if (de) de.textContent = new Intl.DateTimeFormat('en-US', { timeZone: z.timeZone, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
                } catch (e) {}
              });
            }
            tick(); setInterval(tick, 1000);
          }
          function catColor(c){ return ({VFR:'#3fb950',MVFR:'#58a6ff',IFR:'#f85149',LIFR:'#ff5cf4'})[c] || 'var(--muted)'; }
          function aviationWidget(a){
            var wd = a.wind || {};
            var wind = (wd.speed != null)
              ? ((wd.dir == null || wd.dir === 'VRB') ? 'VRB' : esc(wd.dir) + '°') + ' @ ' + esc(wd.speed) + 'kt' + (wd.gust ? ' G' + esc(wd.gust) : '')
              : '—';
            var col = catColor(a.flightCategory);
            var cat = a.flightCategory ? '<span class="avn-cat" style="background:' + col + '22;color:' + col + '">' + esc(a.flightCategory) + '</span>' : '';
            var head = '<div class="avn-head"><span class="avn-name">' + esc(a.icao) + ' — ' + esc(a.name) + '</span>' + cat + '</div>';
            var dec = '<div class="avn-decoded">' +
              (a.temp != null ? '<span>🌡️ <b>' + esc(a.temp) + '°C</b>' + (a.dewp != null ? ' / dew ' + esc(a.dewp) + '°C' : '') + '</span>' : '') +
              '<span>💨 <b>' + wind + '</b></span>' +
              (a.visib ? '<span>👁️ <b>' + esc(a.visib) + '</b></span>' : '') +
              (a.altim ? '<span>QNH <b>' + esc(a.altim) + ' hPa</b></span>' : '') +
              '</div>';
            var raw = '<div class="avn-raw-label">METAR</div><div class="avn-raw">' + esc(a.rawMetar) + '</div>';
            if (a.rawTaf) raw += '<div class="avn-raw-label">TAF</div><div class="avn-raw">' + esc(a.rawTaf) + '</div>';
            return widget('Aviation weather', head + dec + raw);
          }
          function kp(wk){
            var thumb = wk.thumbnail ? '<div class="kp-thumb"><img src="' + attr(wk.thumbnail) + '" alt="" loading="lazy"></div>' : '';
            return '<div class="kp">' + thumb + '<div class="kp-body"><div class="kp-title">' + esc(wk.title) + '</div>' +
              (wk.description ? '<div class="kp-desc">' + esc(wk.description) + '</div>' : '') +
              '<div class="kp-extract">' + esc(wk.extract) + '</div>' +
              '<a class="kp-link" href="' + attr(wk.url) + '" rel="noopener" target="_blank">Wikipedia &rarr;</a></div></div>';
          }
          function relatedBlock(rel){
            var chips = rel.map(function(r){ return '<a href="/search?q=' + encodeURIComponent(r) + '">' + esc(r) + '</a>'; }).join('');
            return '<div class="related"><div class="related-label">Related searches</div>' + chips + '</div>';
          }
          function ago(ms){ var s=Math.floor((Date.now()-ms)/1000); if(s<60)return s+'s ago'; var m=Math.floor(s/60); if(m<60)return m+'m ago'; var h=Math.floor(m/60); if(h<24)return h+'h ago'; return Math.floor(h/24)+'d ago'; }
          function rows(rr){ return '<dl class="iwidget-rows">' + rr.map(function(r){ return '<dt>'+esc(r[0])+'</dt><dd class="' + (r[2]?'mono':'') + '">'+esc(r[1])+'</dd>'; }).join('') + '</dl>'; }
          // ── Dev tools ──
          function devWidget(d){
            var main = '<div class="iwidget-main' + (d.mono?' mono':'') + '">' + esc(d.main) + (d.swatch?'<span class="color-swatch" style="background:'+attr(d.swatch)+'"></span>':'') + '</div>';
            var sub = d.sub ? '<div class="iwidget-sub">' + esc(d.sub) + '</div>' : '';
            var extra = d.rows ? rows(d.rows) : '';
            return widget(d.label, main + sub + extra);
          }
          function dnsWidget(x){
            var body = '<div class="iwidget-sub" style="margin:0 0 8px">' + esc(x.host) + ' &middot; ' + esc(x.type) + '</div>' +
              x.records.map(function(r){ return '<div class="mono" style="font-size:14px;color:var(--title);line-height:1.7">' + esc(r) + '</div>'; }).join('');
            return widget('DNS lookup', body);
          }
          function whoisWidget(x){
            var rr = [];
            if (x.registrar) rr.push(['Registrar', x.registrar]);
            if (x.created) rr.push(['Registered', x.created]);
            if (x.expires) rr.push(['Expires', x.expires]);
            if (x.updated) rr.push(['Updated', x.updated]);
            if (x.status) rr.push(['Status', x.status]);
            if (x.ns && x.ns.length) rr.push(['Nameservers', x.ns.join(', ')]);
            return widget('Whois — ' + esc(x.domain), rows(rr));
          }
          // ── Nerd data ──
          function quakeWidget(x){
            function magc(m){ return m>=6?'#f85149':m>=4.5?'#e3b341':'#58a6ff'; }
            var body = x.quakes.map(function(e){
              var mg = (e.mag!=null?e.mag.toFixed(1):'?');
              return '<div class="list-row"><span><span class="mag" style="background:'+magc(e.mag)+'22;color:'+magc(e.mag)+'">M'+esc(mg)+'</span> ' +
                (e.url?'<a href="'+attr(e.url)+'" rel="noopener" target="_blank">'+esc(e.place)+'</a>':esc(e.place)) + '</span>' +
                '<span class="iwidget-sub" style="margin:0;white-space:nowrap">'+esc(ago(e.time))+'</span></div>';
            }).join('');
            return widget(x.title, body);
          }
          function issWidget(x){
            return widget('ISS — live position',
              '<div class="iwidget-main">' + esc(x.lat) + '°, ' + esc(x.lon) + '°</div>' +
              '<div class="iwidget-sub">Over ' + esc(x.over) + ' &middot; ' + esc(x.altKm) + ' km up &middot; ' + esc(x.speedKmh.toLocaleString()) + ' km/h</div>' +
              '<a class="kp-link" href="https://isstracker.pl/en" rel="noopener" target="_blank">Live map &rarr;</a>');
          }
          function launchWidget(x){
            var body = x.launches.map(function(l){
              var t = l.net ? new Date(l.net).toLocaleString('en-AU',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'TBD';
              return '<div class="list-row"><span><b style="color:var(--title)">'+esc(l.name)+'</b>' + (l.pad?'<div class="iwidget-sub" style="margin:2px 0 0">'+esc(l.pad)+'</div>':'') + '</span>' +
                '<span class="iwidget-sub" style="margin:0;white-space:nowrap;text-align:right">'+esc(t)+'</span></div>';
            }).join('');
            return widget(x.title, body);
          }
          function moonWidget(x){
            return widget('Moon phase',
              '<div class="weather-row"><div class="weather-emoji">'+esc(x.emoji)+'</div><div>' +
              '<div class="weather-temp" style="font-size:26px">'+esc(x.name)+'</div>' +
              '<div class="iwidget-sub">'+esc(x.illum)+'% illuminated &middot; '+esc(x.age)+' days old</div></div></div>');
          }
          function auroraWidget(x){
            var col = x.kp>=7?'#ff5cf4':x.kp>=5?'#f85149':x.kp>=4?'#e3b341':'#3fb950';
            return widget('Aurora / geomagnetic',
              '<div class="iwidget-main" style="color:'+col+'">Kp ' + esc(x.kp) + '</div>' +
              '<div class="iwidget-sub">'+esc(x.activity)+' &middot; '+esc(x.chance)+'</div>');
          }
          function sunWidget(x){
            return widget('Sun times — ' + esc(x.place),
              '<div class="clock-row"><div class="clock"><div class="clock-time" style="font-size:22px">'+esc(x.sunrise)+'</div><div class="clock-place">Sunrise</div></div>' +
              '<div class="clock"><div class="clock-time" style="font-size:22px">'+esc(x.sunset)+'</div><div class="clock-place">Sunset</div></div>' +
              (x.daylight?'<div class="clock"><div class="clock-time" style="font-size:22px">'+esc(x.daylight)+'</div><div class="clock-place">Daylight</div></div>':'') + '</div>');
          }
          function surfWidget(x){
            var rr = [['Wave height', x.waveHeight + ' m']];
            if (x.wavePeriod!=null) rr.push(['Period', x.wavePeriod + ' s']);
            if (x.waveDir) rr.push(['Direction', x.waveDir]);
            if (x.seaTemp!=null) rr.push(['Sea temp', x.seaTemp + '°C']);
            return widget('Surf &middot; ' + esc(x.place), '<div class="iwidget-main">🌊 ' + esc(x.waveHeight) + ' m</div>' + rows(rr));
          }
          // ── Rich cards ──
          function movieWidget(x){
            var meta = [x.year, x.kind==='tv'?'TV':'', x.runtime, x.seasons].filter(Boolean).join(' &middot; ');
            var g = x.genres && x.genres.length ? '<div class="iwidget-sub">'+esc(x.genres.join(', '))+'</div>' : '';
            var rate = x.rating ? '<span style="color:#e3b341;font-weight:700">★ '+esc(x.rating)+'</span>' : '';
            var poster = x.poster ? '<img class="movie-poster" src="'+attr(x.poster)+'" alt="" loading="lazy">' : '';
            return widget(x.kind==='tv'?'TV series':'Movie',
              '<div class="movie-card">' + poster + '<div><div class="kp-title">'+esc(x.title)+' '+rate+'</div>' +
              '<div class="iwidget-sub" style="margin-top:4px">'+meta+'</div>' + g +
              '<div class="kp-extract" style="margin-top:8px">'+esc(x.overview)+'</div></div></div>');
          }
          function transitWidget(x){
            var body = x.departures.map(function(d){
              return '<div class="list-row"><span>' + (d.route?'<span class="mag" style="background:var(--accent)22;color:var(--accent)">'+esc(d.route)+'</span> ':'') + esc(d.dest||'') + '</span>' +
                '<span style="white-space:nowrap;text-align:right"><b class="' + (d.delayed?'down':'up') + '">'+esc(d.when)+'</b><div class="iwidget-sub" style="margin:0">'+esc(d.time)+'</div></span></div>';
            }).join('');
            return widget('Departures — ' + esc(x.stop), body);
          }
          // ── Markets ──
          function stockWidget(x){
            var cls = x.up?'up':'down', sign = x.up?'+':'';
            return widget('Stock &middot; ' + esc(x.symbol),
              (x.name?'<div class="iwidget-sub" style="margin:0 0 6px">'+esc(x.name)+' &middot; '+esc(x.exchange)+'</div>':'') +
              '<div class="iwidget-main">' + esc(x.price.toLocaleString()) + ' <span style="font-size:14px;color:var(--muted)">'+esc(x.currency)+'</span></div>' +
              '<div class="'+cls+'" style="font-size:14px;font-weight:600;margin-top:4px">'+sign+esc(x.change)+' ('+sign+esc(x.pct)+'%)</div>');
          }
          function cryptoWidget(x){
            var cls = x.up?'up':'down', sign = x.up?'+':'';
            var aud = x.aud!=null ? '<div class="iwidget-sub">A$'+esc(x.aud.toLocaleString())+'</div>' : '';
            return widget('Crypto &middot; ' + esc(x.name),
              '<div class="iwidget-main">$' + esc(x.usd.toLocaleString()) + ' <span style="font-size:14px;color:var(--muted)">USD</span></div>' + aud +
              '<div class="'+cls+'" style="font-size:14px;font-weight:600;margin-top:4px">'+sign+esc(x.pct)+'% (24h)</div>');
          }
          function sportWidget(x){
            var body = x.games.map(function(g){
              var score = (g.hs!=null && g.as!=null) ? '<b style="color:var(--title)">'+esc(g.hs)+' – '+esc(g.as)+'</b>' : '<span class="iwidget-sub" style="margin:0">'+esc(g.date)+(g.time?' '+esc(g.time):'')+'</span>';
              return '<div class="list-row"><span>'+esc(g.home)+' v '+esc(g.away)+'</span><span style="white-space:nowrap">'+score+'</span></div>';
            }).join('');
            return widget((x.upcoming?'Fixtures — ':'Results — ') + esc(x.league), body);
          }
          var instantP = window.__instantP || (window.__instantP = fetch('/api/instant?q=' + encodeURIComponent(q)).then(function (r) { return r.json(); }).catch(function () { return null; }));
          instantP
            .then(function (d) {
              if (!d || !d.hasPanel) return;
              var w = d.widgets || {}, html = '';
              if (w.calc)     html += widget('Calculator', '<div class="iwidget-main">' + esc(w.calc.result) + '</div><div class="iwidget-sub">' + esc(w.calc.expression) + '</div>');
              if (w.unit)     html += widget('Conversion', '<div class="iwidget-main">' + esc(w.unit.label) + '</div>');
              if (w.currency) html += widget('Currency', '<div class="iwidget-main">' + esc(w.currency.label) + '</div><div class="iwidget-sub">Live market rate</div>');
              if (w.dictionary) html += dictWidget(w.dictionary);
              if (w.aviation) html += aviationWidget(w.aviation);
              if (w.weather)  html += weatherWidget(w.weather);
              if (w.time)     html += timeWidget(w.time);
              if (w.dev)      html += devWidget(w.dev);
              if (w.dns)      html += dnsWidget(w.dns);
              if (w.whois)    html += whoisWidget(w.whois);
              if (w.quake)    html += quakeWidget(w.quake);
              if (w.iss)      html += issWidget(w.iss);
              if (w.launch)   html += launchWidget(w.launch);
              if (w.moon)     html += moonWidget(w.moon);
              if (w.aurora)   html += auroraWidget(w.aurora);
              if (w.sun)      html += sunWidget(w.sun);
              if (w.surf)     html += surfWidget(w.surf);
              if (w.movie)    html += movieWidget(w.movie);
              if (w.transit)  html += transitWidget(w.transit);
              if (w.stock)    html += stockWidget(w.stock);
              if (w.crypto)   html += cryptoWidget(w.crypto);
              if (w.sport)    html += sportWidget(w.sport);
              if (d.wiki)     html += kp(d.wiki);
              if (d.related && d.related.length) html += relatedBlock(d.related);
              el.innerHTML = html;
              if (w.time) startClock(w.time.zones);
            })
            .catch(function () {});
        })();
      </script>
      <div id="results-list">${results}</div>
      ${hits.length ? `<div class="pagination">${prevLink}${nextLink}</div>` : ''}
      <script>
        (function () {
          var q = ${JSON.stringify(q)}, page = ${page};
          if (page !== 0) return;
          var list = document.getElementById('results-list');
          if (!list) return;
          function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
          function attr(t){ return esc(t).replace(/"/g,'&quot;'); }
          function render(h){
            var title = (h._formatted && h._formatted.title) || esc(h.title || h.domain);
            var snip = (h._formatted && h._formatted.description) || esc(h.description || '');
            return '<div class="result"><div class="result-url">' + esc(h.url) + '</div>' +
              '<div class="result-title"><a href="' + attr(h.url) + '" rel="noopener">' + title + '</a></div>' +
              (snip ? '<div class="result-snippet">' + snip + '</div>' : '') + '</div>';
          }
          // Fetch the AI-reranked results; if the first call raced past the budget
          // (smart:false), the server finishes and caches shortly after, so retry once.
          function go(attempt){
            fetch('/api/search?q=' + encodeURIComponent(q) + '&smart=1')
              .then(function(r){ return r.json(); })
              .then(function(d){
                if (d && d.smart && d.hits && d.hits.length) { list.innerHTML = d.hits.map(render).join(''); return; }
                if (attempt < 1) setTimeout(function(){ go(attempt + 1); }, 2600);
              })
              .catch(function(){});
          }
          go(0);
        })();
      </script>
      <div class="footer">
        <a href="https://theradicalparty.com">theradicalparty.com</a>
        &nbsp;&mdash;&nbsp;
        ${(data.nodeId ?? 'main')} node
      </div>
    </div>
  `, { noindex: true, canonical: `${SITE}/search?q=${encodeURIComponent(q)}`, description: `Search results for "${q}" on RADICAL_SEARCH — the independent open-web search engine.` })
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

    if (url.pathname === '/og.svg') {
      return new Response(OG_IMAGE, {
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
      })
    }

    if (url.pathname === '/robots.txt') {
      // Allow the homepage; keep dynamic search-result and API URLs out of the
      // crawl (Google discourages indexing internal search results, and this
      // avoids wasting crawl budget on an unbounded query space).
      const body = `User-agent: *
Allow: /$
Disallow: /search
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`
      return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    if (url.pathname === '/sitemap.xml') {
      const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>2026-07-22</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`
      return new Response(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
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
        // SSR fetches raw results (fast). The smart rewrite+rerank is applied
        // client-side as a progressive upgrade so first paint is never blocked
        // on the AI round-trips.
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
