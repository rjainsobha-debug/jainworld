/**
 * news.js — JainWorld Auto News System
 * Fetches from Cloudflare Worker /api/news
 * Falls back to static sample data if worker unavailable
 * jainworld.in
 */

const NEWS_API = '/api/news';
const NEWS_CACHE_KEY = 'jainworld_news_v1';
const NEWS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/* ── Fallback news (shown while loading or on error) ─────── */
const FALLBACK_NEWS = [
  { title:"Paryushan Mahaparva 2025 Celebrations Begin Across India", source:"Times of India", date:"Today", summary:"The eight-day Paryushan festival commenced across temples in Mumbai, Ahmedabad, Jaipur, and 50+ cities with record participation.", link:"#", category:"Festival" },
  { title:"Jain International Organisation Launches Global Youth Summit in London", source:"Jain World News", date:"Yesterday", summary:"JIO announced its annual youth summit in London this August, bringing together 500 young Jains from 20 countries.", link:"#", category:"World" },
  { title:"New Jain Derasar Consecrated in Harrow, London After Decade of Planning", source:"Indian Express", date:"2 days ago", summary:"A new Jain derasar was formally consecrated in Harrow, North London, drawing over 3,000 devotees from across the UK.", link:"#", category:"Diaspora" },
  { title:"Mahavir Jayanti: 5 Lakh Devotees Visit Pawapuri, Rajgir, and Vaishali", source:"Hindustan Times", date:"3 days ago", summary:"This year's Mahavir Jayanti saw massive pilgrim turnout at sacred sites in Bihar, with the Bihar government facilitating special trains.", link:"#", category:"Pilgrimage" },
  { title:"Jain Scholars Convene to Digitize 10,000 Ancient Agama Manuscripts", source:"The Hindu", date:"4 days ago", summary:"A landmark conference in Ahmedabad launched a project to digitize rare manuscripts housed in Jain libraries across Rajasthan and Gujarat.", link:"#", category:"Education" },
  { title:"Palitana Temple Committee Announces Restoration of 16th Century Temples", source:"Gujarat Samachar", date:"5 days ago", summary:"The Anandji Kalyanji Pedhi trust announced restoration plans for historic temples at Palitana's Shatrunjaya hill.", link:"#", category:"Heritage" },
  { title:"First Jain Meditation Centre Opens in Singapore's Cultural District", source:"Jain Digest", date:"6 days ago", summary:"A dedicated Jain meditation and knowledge centre opened in Singapore, catering to the growing Jain diaspora in Southeast Asia.", link:"#", category:"Diaspora" },
  { title:"Digambara Munis Begin Annual Vihar from Shravanabelagola", source:"Deccan Herald", date:"1 week ago", summary:"A group of Digambara Munis commenced their annual padyatra (walking pilgrimage) from Shravanabelagola toward Karnataka's northern districts.", link:"#", category:"Spiritual" },
];

/* ── Cache helpers ────────────────────────────────────────── */
function getCachedNews() {
  try {
    const raw = sessionStorage.getItem(NEWS_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < NEWS_CACHE_TTL) return data;
  } catch (_) {}
  return null;
}

function setCachedNews(data) {
  try {
    sessionStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch (_) {}
}

/* ── Fetch from Worker ────────────────────────────────────── */
async function fetchNewsFromWorker() {
  const cached = getCachedNews();
  if (cached) return cached;

  try {
    const res = await fetch(NEWS_API, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('Worker returned ' + res.status);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setCachedNews(data);
      return data;
    }
  } catch (err) {
    console.warn('[JainWorld] News worker unavailable, using fallback:', err.message);
  }
  return FALLBACK_NEWS;
}

/* ── Render helpers ───────────────────────────────────────── */
function categoryBadge(cat) {
  const map = { Festival:'badge-event', World:'badge-news', Diaspora:'badge-news', Pilgrimage:'badge-event', Education:'badge-blog', Heritage:'badge-blog', Spiritual:'badge-event' };
  const cls = map[cat] || 'badge-news';
  return `<span class="badge ${cls}">${cat}</span>`;
}

function newsItemHTML(item, isHomepage = false) {
  if (isHomepage) {
    return `<li>
      <div class="nt"><a href="${item.link || '#'}" target="_blank" rel="noopener">${item.title}</a></div>
      <div class="nm">📍 ${item.source || 'Jain News'} · ${item.date || ''} · ${categoryBadge(item.category || 'News')}</div>
    </li>`;
  }
  return `<li class="al-item">
    <div>
      <div class="al-cat">${item.category || 'News'} · ${item.source || ''}</div>
      <div class="al-title"><a href="${item.link || '#'}" target="_blank" rel="noopener">${item.title}</a></div>
      <div class="al-excerpt">${item.summary || ''}</div>
      <div class="al-meta"><span>📅 ${item.date || ''}</span></div>
    </div>
    <div class="al-date">${item.date || ''}</div>
  </li>`;
}

function skeletonNews(count = 5, isHomepage = false) {
  if (isHomepage) {
    return Array(count).fill(0).map(() => `
      <li class="loading-placeholder">
        <div class="skeleton skeleton-line wide"></div>
        <div class="skeleton skeleton-line short" style="margin-top:0.3rem"></div>
      </li>`).join('');
  }
  return Array(count).fill(0).map(() => `
    <li class="al-item loading-placeholder">
      <div style="flex:1">
        <div class="skeleton skeleton-line short"></div>
        <div class="skeleton skeleton-line wide" style="margin-top:0.35rem"></div>
        <div class="skeleton skeleton-line mid" style="margin-top:0.3rem"></div>
      </div>
    </li>`).join('');
}

/* ── Public API ───────────────────────────────────────────── */
async function renderHomeNews(targetId, count = 5) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = skeletonNews(count, true);
  const news = await fetchNewsFromWorker();
  el.innerHTML = news.slice(0, count).map(n => newsItemHTML(n, true)).join('');
}

async function renderNewsPage(targetId, count = 20) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = skeletonNews(count, false);
  const news = await fetchNewsFromWorker();
  el.innerHTML = news.slice(0, count).map(n => newsItemHTML(n, false)).join('');
}

/* ── News search integration ──────────────────────────────── */
async function getNewsForSearch() {
  return fetchNewsFromWorker();
}

export { renderHomeNews, renderNewsPage, getNewsForSearch, FALLBACK_NEWS };
