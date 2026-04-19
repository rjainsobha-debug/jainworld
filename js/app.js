/**
 * app.js — JainWorld Main Application
 * Page routing, search, literature, home assembly
 * Imports: data.js, news.js, community.js
 * jainworld.in
 */

import { TIRTHANKARAS, PHILOSOPHY_CARDS, CULTURE_ITEMS, SAMPLE_MEMBERS, SAMPLE_JOBS, SAMPLE_BUSINESSES } from './data.js';
import { renderHomeNews, renderNewsPage, getNewsForSearch, FALLBACK_NEWS } from './news.js';
import { renderMembers, renderJobs, renderBusinesses, renderJoinForm, switchCommunityTab, renderHomeBlogs, renderBlogPage, FALLBACK_BLOGS } from './community.js';

/* ── State ────────────────────────────────────────────────── */
let literatureData = [];
let activePage     = 'home';

/* ── Expose global namespace ──────────────────────────────── */
window.JW = {
  showPage,
  doSearch,
  switchTab:       switchCommunityTabPublic,
  showLitArticle,
  showBlogArticle,
  showTirthankaraDetail,
};

/* ================================================================
   PAGE NAVIGATION
================================================================ */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-inner a').forEach(a => a.classList.remove('active'));

  const page = document.getElementById('page-' + id);
  if (page) {
    page.classList.add('active');
    activePage = id;
  } else {
    // Unknown page, default to home
    document.getElementById('page-home').classList.add('active');
    activePage = 'home';
  }

  const navLink = document.getElementById('nav-' + id);
  if (navLink) navLink.classList.add('active');

  window.scrollTo(0, 0);

  // Lazy-trigger section renderers on first visit
  switch (id) {
    case 'tirthankaras': buildTirthankaraGrid(); break;
    case 'literature':   renderLiteraturePage(); break;
    case 'news':         renderNewsPage('news-list-dynamic'); break;
    case 'blog':         renderBlogPage('blog-list-dynamic'); break;
    case 'community':    initCommunityPage(); break;
    case 'philosophy':   renderPhilosophyPage(); break;
    case 'culture':      renderCulturePage(); break;
  }
}

/* ================================================================
   HOMEPAGE ASSEMBLY
================================================================ */
async function initHomepage() {
  // Hero search binding
  document.getElementById('home-search-btn').addEventListener('click', doSearch);
  document.getElementById('home-search-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  document.getElementById('header-search-btn').addEventListener('click', doSearch);
  document.getElementById('header-search-input').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

  // Sync search inputs
  document.getElementById('header-search-input').addEventListener('input', function () {
    document.getElementById('home-search-input').value = this.value;
  });
  document.getElementById('home-search-input').addEventListener('input', function () {
    document.getElementById('header-search-input').value = this.value;
  });

  // Mobile menu
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    const nav = document.getElementById('main-nav');
    nav.style.display = nav.style.display === 'none' ? 'block' : '';
  });

  // Load dynamic content in parallel
  await Promise.allSettled([
    renderHomeNews('home-news-list', 5),
    renderHomeBlogs('home-blog-list', 3),
    buildHomeTirthankaraLinks(),
  ]);
}

function buildHomeTirthankaraLinks() {
  const el = document.getElementById('home-tirthankara-links');
  if (!el) return;
  const featured = [1, 16, 22, 23, 24];
  el.innerHTML = TIRTHANKARAS
    .filter(t => featured.includes(t.n))
    .map(t => `<li><a href="#" onclick="window.JW.showPage('${t.page || 'tirthankaras'}');return false">${t.n}. ${t.name}${t.aka ? ' (' + t.aka + ')' : ''}</a></li>`)
    .join('');
}

/* ================================================================
   TIRTHANKARAS
================================================================ */
let tirthankaraGridBuilt = false;

function buildTirthankaraGrid() {
  if (tirthankaraGridBuilt) return;
  const grid = document.getElementById('tirthankara-grid');
  if (!grid) return;
  const ord = n => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
  grid.innerHTML = TIRTHANKARAS.map(t => `
    <div class="t-card" onclick="window.JW.showPage('${t.page || 'tirthankaras'}')">
      <div class="t-num">${ord(t.n)} Tirthankara</div>
      <div class="t-symbol">${t.symbol}</div>
      <div class="t-name">${t.name}</div>
      <div class="t-sub">${t.aka ? t.aka + ' · ' : ''}${t.city}</div>
    </div>`).join('');
  tirthankaraGridBuilt = true;
}

function showTirthankaraDetail(n) {
  // For tirthankaras without dedicated pages, show a generic detail page
  const t = TIRTHANKARAS.find(x => x.n === n);
  if (!t) return;
  const el = document.getElementById('page-tirthankara-detail');
  if (!el) return;
  const ord = n => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
  el.innerHTML = `
    <div class="content-layout">
      <div class="content-sidebar-left">
        <div class="toc-title">Navigation</div>
        <a href="#" onclick="window.JW.showPage('tirthankaras');return false" style="font-size:0.82rem;color:var(--text3);display:block;margin-bottom:0.5rem">← All Tirthankaras</a>
        ${t.n > 1 ? `<a href="#" onclick="window.JW.showTirthankaraDetail(${t.n - 1});return false" style="font-size:0.82rem;color:var(--text3);display:block">← ${t.n - 1}. ${TIRTHANKARAS[t.n - 2].name}</a>` : ''}
        ${t.n < 24 ? `<a href="#" onclick="window.JW.showTirthankaraDetail(${t.n + 1});return false" style="font-size:0.82rem;color:var(--text3);display:block;margin-top:0.3rem">${t.n + 1}. ${TIRTHANKARAS[t.n].name} →</a>` : ''}
      </div>
      <div class="content-main">
        <div class="breadcrumb"><a href="#" onclick="window.JW.showPage('home');return false">Home</a> › <a href="#" onclick="window.JW.showPage('tirthankaras');return false">Tirthankaras</a> › ${t.name}</div>
        <h1>${t.name} — The ${ord(t.n)} Tirthankara</h1>
        <div class="article-meta"><span>📍 ${ord(t.n)} Tirthankara</span><span>🐾 ${t.city}</span></div>
        <div class="infobox">
          <div class="infobox-header">${t.name}</div>
          <div class="infobox-symbol">${t.symbol}</div>
          <table>
            <tr><td>Order</td><td>${ord(t.n)}</td></tr>
            <tr><td>Symbol</td><td>${t.symbol}</td></tr>
            <tr><td>Birth City</td><td>${t.city}</td></tr>
            ${t.aka ? `<tr><td>Also Known As</td><td>${t.aka}</td></tr>` : ''}
          </table>
        </div>
        <p>${t.name} is the ${ord(t.n)} Tirthankara of the present cosmic half-cycle (Avasarpiṇī). Born in ${t.city}, they attained Kevala Jnana (omniscience) after intense spiritual practice and proceeded to teach the path of liberation to countless souls.</p>
        <p>Like all Tirthankaras, ${t.name} preached the five great principles: non-violence (Ahimsa), truthfulness (Satya), non-stealing (Asteya), celibacy (Brahmacharya), and non-possessiveness (Aparigraha). Their symbol is ${t.symbol}.</p>
        <div class="clearfix"></div>
        <div class="notice">Full article for ${t.name} coming soon. <a href="#" onclick="window.JW.showPage('tirthankaras');return false">View all 24 Tirthankaras →</a></div>
        <div class="tag-row"><a href="#">${t.name}</a><a href="#">${ord(t.n)} Tirthankara</a><a href="#">${t.city}</a></div>
      </div>
      <div class="content-sidebar-right">
        <div class="section-label" style="margin-bottom:0.7rem">All Tirthankaras</div>
        <ul style="list-style:none;padding:0;font-size:0.82rem;max-height:300px;overflow-y:auto">
          ${TIRTHANKARAS.map(x => `<li style="padding:0.2rem 0;border-bottom:1px solid var(--border)"><a href="#" onclick="window.JW.showTirthankaraDetail(${x.n});return false" style="${x.n === t.n ? 'font-weight:700;color:var(--accent)' : ''}">${x.n}. ${x.name}</a></li>`).join('')}
        </ul>
      </div>
    </div>`;
  showPage('tirthankara-detail');
}

/* ================================================================
   LITERATURE
================================================================ */
let litPageBuilt = false;

async function loadLiterature() {
  if (literatureData.length > 0) return literatureData;
  try {
    const res = await fetch('./data/literature.json');
    if (res.ok) literatureData = await res.json();
  } catch (_) {}
  return literatureData;
}

async function renderLiteraturePage() {
  if (litPageBuilt) return;
  const el = document.getElementById('lit-grid-dynamic');
  if (!el) return;
  el.innerHTML = `<div class="skeleton skeleton-line wide" style="height:100px;margin-bottom:0.5rem"></div>`.repeat(3);
  const data = await loadLiterature();
  if (!data.length) { el.innerHTML = '<p style="color:var(--text3)">Literature is loading…</p>'; return; }
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.type]) grouped[item.type] = [];
    grouped[item.type].push(item);
  });
  let html = '';
  for (const [type, items] of Object.entries(grouped)) {
    html += `<h2 style="margin:1.4rem 0 0.8rem;padding-top:0.4rem;border-top:1px solid var(--border)">${type}</h2>
    <div class="lit-grid">
      ${items.map(item => `
        <div class="lit-card" onclick="window.JW.showLitArticle('${item.id}')">
          <div class="lit-type">${item.type} · ${item.language}</div>
          <div class="lit-title">${item.title}</div>
          <div class="lit-lang">${item.category}</div>
          <div class="lit-excerpt">${item.excerpt || ''}</div>
        </div>`).join('')}
    </div>`;
  }
  el.innerHTML = html;
  litPageBuilt = true;
}

async function showLitArticle(id) {
  const data = await loadLiterature();
  const item = data.find(x => x.id === id);
  if (!item) return;
  const el = document.getElementById('page-lit-article');
  if (!el) return;
  el.innerHTML = `
    <div class="lit-article">
      <div class="breadcrumb"><a href="#" onclick="window.JW.showPage('home');return false">Home</a> › <a href="#" onclick="window.JW.showPage('literature');return false">Literature</a> › ${item.title}</div>
      <h1>${item.title}</h1>
      <div class="lit-meta">${item.type} · ${item.language} · ${item.category}</div>
      <div class="lit-body">${item.content.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('')}</div>
      <div class="tag-row">${(item.tags || []).map(t => `<a href="#">${t}</a>`).join('')}</div>
      <p style="margin-top:1.5rem"><a href="#" onclick="window.JW.showPage('literature');return false">← Back to Literature</a></p>
    </div>`;
  showPage('lit-article');
}

/* ================================================================
   PHILOSOPHY PAGE
================================================================ */
let philBuilt = false;

function renderPhilosophyPage() {
  if (philBuilt) return;
  const el = document.getElementById('philosophy-grid-dynamic');
  if (!el) return;
  el.innerHTML = PHILOSOPHY_CARDS.map(p => `
    <div class="phil-card" onclick="${p.litId ? `window.JW.showLitArticle('${p.litId}')` : ''}">
      <div class="phil-icon">${p.icon}</div>
      <div class="phil-title">${p.title}</div>
      <div class="phil-sanskrit">${p.sanskrit}</div>
      <div class="phil-desc">${p.desc}</div>
    </div>`).join('');
  philBuilt = true;
}

/* ================================================================
   CULTURE PAGE
================================================================ */
let cultureBuilt = false;

function renderCulturePage() {
  if (cultureBuilt) return;
  const el = document.getElementById('culture-grid-dynamic');
  if (!el) return;
  el.innerHTML = CULTURE_ITEMS.map(c => `
    <div class="phil-card" style="cursor:default">
      <div class="phil-icon">${c.icon}</div>
      <div class="phil-title">${c.title}</div>
      <div class="phil-desc">${c.desc}</div>
    </div>`).join('');
  cultureBuilt = true;
}

/* ================================================================
   BLOG ARTICLE VIEW
================================================================ */
async function showBlogArticle(id) {
  const blogs = FALLBACK_BLOGS; // In prod: fetch from worker
  const blog = blogs.find(b => b.id === id);
  if (!blog) return;

  // Blog article content map (in prod: fetched from Sheets/worker)
  const BLOG_CONTENT = {
    'jain-diet': `<p>When people first hear about the Jain diet, they typically assume it is simply another form of veganism. While this is partially correct, the Jain dietary system is a sophisticated, philosophically grounded framework rooted in one foundational principle: <strong>Ahimsa</strong> — the minimization of harm to all living beings.</p>
    <h3>The Sense-Based Classification of Life</h3>
    <p>Jain philosophy classifies all living beings (Jivas) by the number of senses they possess. The more senses a being possesses, the greater its capacity for suffering, and therefore the more harmful it is to kill it.</p>
    <ul><li><strong>One-sensed (Ekendriya)</strong> — Earth, water, fire, air, plants. Only touch.</li>
    <li><strong>Two-sensed (Dvindriya)</strong> — Worms, leeches. Touch and taste.</li>
    <li><strong>Three-sensed (Trindriya)</strong> — Lice, ants. Touch, taste, smell.</li>
    <li><strong>Four-sensed (Chaturindriya)</strong> — Flies, mosquitoes, bees. Adds sight.</li>
    <li><strong>Five-sensed with mind</strong> — Mammals, birds, humans. All senses plus consciousness.</li></ul>
    <h3>Why Veganism Falls Short</h3>
    <p>A vegan avoids all animal products but may freely consume root vegetables. To a Jain, this misses a crucial point: root vegetables like potatoes and onions contain <em>anant-kayas</em> — they host infinite numbers of microscopic lives within a single body. Pulling a potato from the ground destroys the habitat for millions of one-sensed beings.</p>
    <h3>Practical Guide</h3>
    <ul><li>Replace potatoes with raw banana or seasonal above-ground vegetables</li>
    <li>Use asafoetida (heeng) as a substitute for onion and garlic flavour</li>
    <li>Eat your largest meal at lunchtime, complete eating before sunset</li>
    <li>Choose whole fruits over juices</li>
    <li>During Paryushan, many Jains eat only boiled food</li></ul>`,
  };

  const content = BLOG_CONTENT[id] || `<p>${blog.summary}</p><p style="color:var(--text3);font-style:italic">Full article content is being added. Check back soon.</p>`;

  const el = document.getElementById('page-blog-article-dynamic');
  if (!el) return;
  el.innerHTML = `
    <div class="content-layout">
      <div class="content-sidebar-left">
        <div class="toc-title">Blog Categories</div>
        <ul style="list-style:none;padding:0;font-size:0.82rem">
          ${['Jain Lifestyle','Health & Diet','Spiritual Insights','Business Ethics','Success Stories'].map(cat =>
            `<li style="padding:0.2rem 0"><a href="#" onclick="window.JW.showPage('blog');return false">${cat}</a></li>`
          ).join('')}
        </ul>
      </div>
      <div class="content-main">
        <div class="breadcrumb"><a href="#" onclick="window.JW.showPage('home');return false">Home</a> › <a href="#" onclick="window.JW.showPage('blog');return false">Blog</a> › ${blog.title}</div>
        <span class="badge badge-blog" style="margin-bottom:0.5rem;display:inline-block">${blog.category}</span>
        <h1>${blog.title}</h1>
        <div class="article-meta">
          <span>📅 ${blog.date}</span><span>⏱️ ${blog.read} read</span><span>By ${blog.author}</span>
        </div>
        ${content}
        <div class="tag-row"><a href="#">${blog.category}</a><a href="#">Jain Lifestyle</a></div>
        <p style="margin-top:1.5rem"><a href="#" onclick="window.JW.showPage('blog');return false">← Back to Blog</a></p>
      </div>
      <div class="content-sidebar-right">
        <div class="section-label" style="margin-bottom:0.7rem">Related Posts</div>
        <ul style="list-style:none;padding:0;font-size:0.82rem">
          ${FALLBACK_BLOGS.filter(b => b.id !== id).slice(0, 4).map(b =>
            `<li style="padding:0.3rem 0;border-bottom:1px solid var(--border)"><a href="#" onclick="window.JW.showBlogArticle('${b.id}');return false">${b.title}</a></li>`
          ).join('')}
        </ul>
      </div>
    </div>`;
  showPage('blog-article-dynamic');
}

/* ================================================================
   COMMUNITY
================================================================ */
let communityInited = false;

function initCommunityPage() {
  if (communityInited) return;
  renderMembers('community-members-grid', SAMPLE_MEMBERS);
  renderJobs('community-jobs-list', SAMPLE_JOBS);
  renderBusinesses('community-biz-grid', SAMPLE_BUSINESSES);
  renderJoinForm('community-join-form');
  communityInited = true;
}

function switchCommunityTabPublic(tabId) {
  switchCommunityTab(tabId);
}

/* ================================================================
   SEARCH
================================================================ */
let searchIndex = [];

async function buildSearchIndex() {
  // Static knowledge entries
  const staticEntries = [
    { title:"Lord Mahavira — The 24th Tirthankara",            cat:"Tirthankara",  type:"Knowledge", page:"tirthankara-mahavir" },
    { title:"Rishabhanatha — The 1st Tirthankara (Adinatha)",  cat:"Tirthankara",  type:"Knowledge", page:"tirthankara-rishabha" },
    { title:"All 24 Tirthankaras",                             cat:"Tirthankara",  type:"Knowledge", page:"tirthankaras" },
    { title:"Ahimsa — Non-violence",                           cat:"Philosophy",   type:"Knowledge", page:"philosophy" },
    { title:"Anekantavada — Many-sidedness of Truth",          cat:"Philosophy",   type:"Knowledge", page:"philosophy" },
    { title:"Karma in Jain Philosophy",                        cat:"Philosophy",   type:"Knowledge", page:"philosophy" },
    { title:"Moksha — Liberation in Jainism",                  cat:"Philosophy",   type:"Knowledge", page:"philosophy" },
    { title:"Three Jewels — Ratnatraya",                       cat:"Philosophy",   type:"Knowledge", page:"philosophy" },
    { title:"Paryushan Mahaparva — Jain Festival Guide",       cat:"Culture",      type:"Knowledge", page:"culture" },
    { title:"Mahavir Jayanti — Significance and Celebration",  cat:"Culture",      type:"Knowledge", page:"culture" },
    { title:"Samvatsari — Day of Universal Forgiveness",       cat:"Culture",      type:"Knowledge", page:"culture" },
    { title:"Jain Diet — What Jains Eat and Why",              cat:"Culture",      type:"Knowledge", page:"culture" },
    { title:"Palitana — City of Temples, Gujarat",             cat:"Culture",      type:"Knowledge", page:"culture" },
    { title:"Acharanga Sutra — 1st Anga Agama",                cat:"Literature",   type:"Knowledge", page:"literature" },
    { title:"Tattvartha Sutra by Umasvati",                    cat:"Literature",   type:"Knowledge", page:"literature" },
    { title:"Navkar Mantra — The Universal Prayer",            cat:"Literature",   type:"Knowledge", page:"literature" },
    { title:"Samayasara by Kundakunda",                        cat:"Literature",   type:"Knowledge", page:"literature" },
    { title:"Jain Community — Jobs Board",                     cat:"Community",    type:"Community", page:"community" },
    { title:"Jain Business Directory",                         cat:"Community",    type:"Community", page:"community" },
    { title:"Join JainWorld Community",                        cat:"Community",    type:"Community", page:"community" },
  ];

  // Add literature items
  const lit = await loadLiterature();
  const litEntries = lit.map(item => ({
    title: item.title, cat: item.type, type: 'Literature', page: null, litId: item.id,
    excerpt: item.excerpt,
  }));

  // Add blogs
  const blogEntries = FALLBACK_BLOGS.map(b => ({
    title: b.title, cat: b.category, type: 'Blog', page: null, blogId: b.id,
    excerpt: b.summary,
  }));

  // Add Tirthankaras
  const titEntries = TIRTHANKARAS.map(t => ({
    title: `${t.n}. ${t.name}${t.aka ? ' (' + t.aka + ')' : ''}`,
    cat: 'Tirthankara', type: 'Knowledge', page: t.page || 'tirthankaras',
  }));

  searchIndex = [...staticEntries, ...litEntries, ...blogEntries, ...titEntries];
}

async function doSearch() {
  const q = (
    document.getElementById('home-search-input')?.value ||
    document.getElementById('header-search-input')?.value ||
    ''
  ).trim().toLowerCase();

  if (!q) return;

  // Ensure index is built
  if (searchIndex.length === 0) await buildSearchIndex();

  // Also search news
  const newsItems = await getNewsForSearch();
  const newsEntries = newsItems.map(n => ({
    title: n.title, cat: n.category || 'News', type: 'News', page: 'news',
    excerpt: n.summary,
  }));

  const allEntries = [...searchIndex, ...newsEntries];

  const results = allEntries.filter(item =>
    item.title.toLowerCase().includes(q) ||
    (item.cat || '').toLowerCase().includes(q) ||
    (item.excerpt || '').toLowerCase().includes(q)
  );

  // Update display
  const queryDisplay = document.getElementById('search-query-display');
  const countDisplay = document.getElementById('search-result-count');
  const listEl       = document.getElementById('search-results-list');

  if (queryDisplay) queryDisplay.textContent = q;
  if (countDisplay) countDisplay.innerHTML = `Found <strong>${results.length}</strong> result${results.length !== 1 ? 's' : ''} for "<strong>${q}</strong>"`;

  if (listEl) {
    if (results.length === 0) {
      listEl.innerHTML = `<div class="no-results">
        No results found for "<strong>${q}</strong>".<br>
        <span style="font-size:0.85rem;color:var(--text3)">Try searching: Mahavira, Ahimsa, Paryushan, Tirthankara, Navkar…</span>
      </div>`;
    } else {
      listEl.innerHTML = results.slice(0, 20).map(r => {
        const action = r.litId
          ? `onclick="window.JW.showLitArticle('${r.litId}');return false"`
          : r.blogId
            ? `onclick="window.JW.showBlogArticle('${r.blogId}');return false"`
            : `onclick="window.JW.showPage('${r.page}');return false"`;
        const badgeCls = r.type === 'News' ? 'badge-news' : r.type === 'Blog' ? 'badge-blog' : 'badge-event';
        return `<li class="al-item">
          <div>
            <div class="al-cat">${r.type} · ${r.cat}</div>
            <div class="al-title"><a href="#" ${action}>${r.title}</a></div>
            ${r.excerpt ? `<div class="al-excerpt">${r.excerpt}</div>` : ''}
          </div>
          <span class="badge ${badgeCls}">${r.type}</span>
        </li>`;
      }).join('');
    }
  }

  showPage('search');
}

/* ================================================================
   BOOTSTRAP
================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  // Wire up main nav clicks
  document.querySelectorAll('.nav-inner a[data-page]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); showPage(a.dataset.page); });
  });

  // Init homepage
  await initHomepage();

  // Pre-build search index in background
  setTimeout(buildSearchIndex, 2000);
});
async function loadBlogs() {
  try {
    const res = await fetch('https://jainworld.rjain-sobha.workers.dev/api/blogs');
    const data = await res.json();

    const container = document.getElementById('blogs-list');
    container.innerHTML = '';

    if (!data.length) {
      container.innerHTML = "<p>No blogs available</p>";
      return;
    }

    data.slice(0, 5).forEach(blog => {
      const div = document.createElement('div');
      div.style.borderBottom = "1px solid #ddd";
      div.style.padding = "10px 0";

      div.innerHTML = `
        <h3 style="margin:0;">${blog.title}</h3>
        <p style="margin:5px 0; font-size:14px; color:#666;">
          ${blog.summary || ''}
        </p>
      `;

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Blog error:", err);
  }
}
