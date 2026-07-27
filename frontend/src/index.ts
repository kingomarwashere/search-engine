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
  @media (max-width: 480px) { .kp-thumb img { width: 64px; height: 64px; } .iwidget-main { font-size: 22px; } }
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
            if (w.calc || w.time || w.weather || w.unit || w.currency || w.dictionary || w.aviation) return;
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
