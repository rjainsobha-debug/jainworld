import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT;
if (!PORT) throw new Error('PORT environment variable is required');

const DATA_FILE = path.join(__dirname, '../api-server/src/data/jainworld.json');
function db() { return JSON.parse(readFileSync(DATA_FILE, 'utf-8')); }

// ─── Hindi Tirthankara names ────────────────────────────────────────────────
const T_HI_NAMES = {
  rishabhanatha: 'ऋषभनाथ (आदिनाथ)', ajitanatha: 'अजितनाथ',
  sambhavanatha: 'संभवनाथ', abhinandananatha: 'अभिनंदन नाथ',
  sumatinatha: 'सुमतिनाथ', padmaprabha: 'पद्मप्रभु',
  suparshvanatha: 'सुपार्श्वनाथ', chandraprabha: 'चंद्रप्रभु',
  pushpadanta: 'पुष्पदंत (सुविधिनाथ)', shitalanatha: 'शीतलनाथ',
  shreyamsanatha: 'श्रेयांसनाथ', vasupujya: 'वासुपूज्य',
  vimalanatha: 'विमलनाथ', anantanatha: 'अनंतनाथ',
  dharmanatha: 'धर्मनाथ', shantinatha: 'शांतिनाथ',
  kunthunatha: 'कुंथुनाथ', aranatha: 'अरनाथ',
  mallinatha: 'मल्लिनाथ', munisuvratanatha: 'मुनिसुव्रत नाथ',
  naminatha: 'नमिनाथ', neminatha: 'नेमिनाथ (अरिष्टनेमि)',
  parshvanatha: 'पार्श्वनाथ', mahavira: 'महावीर (वर्धमान)',
};

// ─── Bilingual helper: renders both langs, JS toggles visibility ─────────────
const t = (hi, en) =>
  `<span data-lang="hi">${hi}</span><span data-lang="en">${en}</span>`;

// ─── Bilingual block helper ──────────────────────────────────────────────────
const tb = (hi, en) =>
  `<span data-lang-block="hi">${hi}</span><span data-lang-block="en">${en}</span>`;

// ─── Escape HTML ─────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ─── Tag list ─────────────────────────────────────────────────────────────────
const tagList = (tags) => tags?.length
  ? `<div class="tag-list">${tags.slice(0,6).map(tag => `<span class="tag">${esc(tag)}</span>`).join('')}</div>` : '';

// ─── Badge ────────────────────────────────────────────────────────────────────
const badge = (label, cls='') => `<span class="badge ${cls}">${esc(label)}</span>`;

// ─── Nav active ──────────────────────────────────────────────────────────────
const navLinks = [
  { href: '/tirthankaras', hi: 'तीर्थंकर', en: 'Tirthankaras' },
  { href: '/literature', hi: 'साहित्य', en: 'Literature' },
  { href: '/bhajans', hi: 'भजन', en: 'Bhajans' },
  { href: '/aartis', hi: 'आरती', en: 'Aartis' },
  { href: '/poems', hi: 'कविताएं', en: 'Poems' },
  { href: '/culture', hi: 'संस्कृति', en: 'Culture' },
  { href: '/philosophy', hi: 'दर्शन', en: 'Philosophy' },
  { href: '/news', hi: 'समाचार', en: 'News' },
  { href: '/blog', hi: 'ब्लॉग', en: 'Blog' },
  { href: '/community', hi: 'समुदाय', en: 'Community' },
];

// ─── Base layout ─────────────────────────────────────────────────────────────
function layout(activePath, title, body) {
  const navHtml = navLinks.map(l => {
    const isActive = activePath === l.href || (activePath.startsWith(l.href) && l.href !== '/');
    return `<a href="${l.href}" class="${isActive ? 'active' : ''}">${t(l.hi, l.en)}</a>`;
  }).join('');

  const mobileNavHtml = navLinks.map(l => {
    const isActive = activePath === l.href || (activePath.startsWith(l.href) && l.href !== '/');
    return `<a href="${l.href}" class="${isActive ? 'active' : ''}">${t(l.hi, l.en)}</a>`;
  }).join('');

  const pageTitle = `${title} — ${t('जैन विश्व', 'JainWorld')}`;

  return `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — JainWorld | जैन विश्व</title>
<meta name="description" content="JainWorld — Free Jain knowledge platform. Tirthankaras, bhajans, aartis, philosophy, literature and community.">
<link rel="stylesheet" href="/public/style.css">
</head>
<body>
<header class="site-header">
  <div class="header-inner">
    <a href="/" class="site-logo">${t('जैन विश्व', 'JainWorld')}</a>
    <nav class="main-nav">${navHtml}</nav>
    <div class="lang-toggle">
      <button class="lang-btn active" id="btn-hi" onclick="setLang('hi')">${t('हिंदी','Hindi')}</button>
      <button class="lang-btn" id="btn-en" onclick="setLang('en')">${t('English','English')}</button>
    </div>
    <button class="hamburger" id="ham" onclick="document.getElementById('mnav').classList.toggle('open');this.setAttribute('aria-expanded',document.getElementById('mnav').classList.contains('open'))">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
    </button>
  </div>
  <div class="mobile-nav" id="mnav">${mobileNavHtml}</div>
</header>

<div class="page-wrap">
${body}
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-cols">
      <div class="footer-col">
        <div class="footer-col-title">${t('तीर्थंकर','Tirthankaras')}</div>
        <a href="/tirthankaras">${t('सभी 24 तीर्थंकर','All 24 Tirthankaras')}</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">${t('भक्ति','Devotion')}</div>
        <a href="/bhajans">${t('भजन','Bhajans')}</a>
        <a href="/aartis">${t('आरती','Aartis')}</a>
        <a href="/poems">${t('कविताएं','Poems')}</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">${t('ज्ञान','Knowledge')}</div>
        <a href="/literature">${t('साहित्य','Literature')}</a>
        <a href="/philosophy">${t('दर्शन','Philosophy')}</a>
        <a href="/culture">${t('संस्कृति','Culture')}</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">${t('नवीनतम','Latest')}</div>
        <a href="/news">${t('समाचार','News')}</a>
        <a href="/blog">${t('ब्लॉग','Blog')}</a>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">${t('समुदाय','Community')}</div>
        <a href="/community">${t('सदस्य','Members')}</a>
        <a href="/community/jobs">${t('नौकरियां','Jobs')}</a>
        <a href="/community/businesses">${t('व्यापार','Businesses')}</a>
      </div>
    </div>
    <div class="footer-bottom">
      ${t('जैन विश्व — मुक्त जैन ज्ञान मंच। अहिंसा, सत्य और जैन ज्ञान के प्रसार के लिए समर्पित।',
          'JainWorld — A free Jain knowledge platform. Dedicated to Ahimsa, Satya, and the spread of Jain wisdom.')}
    </div>
  </div>
</footer>

<script>
(function(){
  var placeholders = {
    'home-search': { hi: 'तीर्थंकर, भजन, दर्शन खोजें...', en: 'Search Tirthankaras, bhajans, philosophy...' }
  };
  function setLang(lang) {
    document.body.classList.toggle('lang-en', lang === 'en');
    document.getElementById('btn-hi').classList.toggle('active', lang === 'hi');
    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    Object.keys(placeholders).forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.placeholder = placeholders[id][lang];
    });
    try { localStorage.setItem('jw-lang', lang); } catch(e){}
  }
  window.setLang = setLang;
  try {
    var saved = localStorage.getItem('jw-lang');
    if (saved === 'en') setLang('en');
  } catch(e){}
})();
</script>
</body>
</html>`;
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function breadcrumb(items) {
  const parts = items.map((item, i) => {
    if (i === items.length - 1) return `<span>${item.label}</span>`;
    return `<a href="${item.href}">${item.label}</a>`;
  });
  return `<nav class="breadcrumb">${parts.join(' › ')}</nav>`;
}

// ─── Page title ───────────────────────────────────────────────────────────────
function pageTitle(hi, en, subHi='', subEn='') {
  return `<div class="page-title">
    <h1>${t(hi, en)}</h1>
    ${(subHi || subEn) ? `<p>${t(subHi || subEn, subEn || subHi)}</p>` : ''}
  </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────
const app = express();
app.use('/public', express.static(path.join(__dirname, 'public')));

// ── HOME ──────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const data = db();
  const stats = {
    tirthankaras: data.tirthankaras?.length ?? 0,
    literature: data.literature?.length ?? 0,
    bhajans: data.bhajans?.length ?? 0,
    poems: data.poems?.length ?? 0,
    blog: data.blog?.length ?? 0,
    businesses: data.community?.businesses?.length ?? data.businesses?.length ?? 0,
  };

  const cats = [
    { href: '/tirthankaras', hi: 'तीर्थंकर', en: 'Tirthankaras', dhi: '२४ जैन तीर्थंकर', den: '24 Enlightened Jinas' },
    { href: '/literature', hi: 'साहित्य', en: 'Literature', dhi: 'आगम, शास्त्र और ग्रंथ', den: 'Agamas, Scriptures & Texts' },
    { href: '/bhajans', hi: 'भजन', en: 'Bhajans', dhi: 'भक्ति गीत और स्तुति', den: 'Devotional Songs & Hymns' },
    { href: '/aartis', hi: 'आरती', en: 'Aartis', dhi: 'पूजा और आराधना', den: 'Ritual Prayers & Worship' },
    { href: '/poems', hi: 'कविताएं', en: 'Poems', dhi: 'भक्ति और नैतिक कविता', den: 'Devotional & Moral Poetry' },
    { href: '/culture', hi: 'संस्कृति', en: 'Culture', dhi: 'त्योहार, भोजन और परंपराएं', den: 'Festivals, Food & Traditions' },
    { href: '/philosophy', hi: 'दर्शन', en: 'Philosophy', dhi: 'अहिंसा, कर्म, मोक्ष', den: 'Ahimsa, Karma & Moksha' },
    { href: '/news', hi: 'समाचार', en: 'News', dhi: 'जैन जगत की ताजा खबरें', den: 'Latest from the Jain World' },
    { href: '/blog', hi: 'ब्लॉग', en: 'Blog', dhi: 'जैन जीवनशैली पर लेख', den: 'Articles on Jain Life' },
    { href: '/community', hi: 'समुदाय', en: 'Community', dhi: 'सदस्य, नौकरी और व्यापार', den: 'Members, Jobs & Businesses' },
  ];

  const body = `
  <div class="hero">
    <h1>${t('जैन विश्व', 'JainWorld')}</h1>
    <p>${t('मुक्त जैन ज्ञान मंच', 'The Free Jain Knowledge Platform')}</p>
    <form class="search-form" action="/search" method="get">
      <input type="search" name="q" id="home-search" placeholder="तीर्थंकर, भजन, दर्शन खोजें..." aria-label="Search">
      <button type="submit" class="btn-amber">${t('खोजें','Search')}</button>
    </form>
  </div>

  <div class="stats-bar">
    <div class="stat-item"><div class="stat-num">${stats.tirthankaras}</div><div class="stat-label">${t('तीर्थंकर','Tirthankaras')}</div></div>
    <div class="stat-item"><div class="stat-num">${stats.literature}</div><div class="stat-label">${t('साहित्य','Literature')}</div></div>
    <div class="stat-item"><div class="stat-num">${stats.bhajans}</div><div class="stat-label">${t('भजन','Bhajans')}</div></div>
    <div class="stat-item"><div class="stat-num">${stats.poems}</div><div class="stat-label">${t('कविताएं','Poems')}</div></div>
    <div class="stat-item"><div class="stat-num">${stats.blog}</div><div class="stat-label">${t('लेख','Articles')}</div></div>
    <div class="stat-item"><div class="stat-num">${stats.businesses}</div><div class="stat-label">${t('व्यापार','Businesses')}</div></div>
  </div>

  <div class="section-heading">${t('विषय के अनुसार देखें','Browse by Category')}</div>
  <div class="cat-grid">
    ${cats.map(c => `
    <a href="${c.href}" class="cat-card">
      <div class="cat-card-title">${t(c.hi, c.en)}</div>
      <div class="cat-card-desc">${t(c.dhi, c.den)}</div>
    </a>`).join('')}
  </div>

  <div class="about-box">
    <h2>${t('जैन विश्व के बारे में','About JainWorld')}</h2>
    <p>${t(
      'जैन विश्व एक मुक्त जैन ज्ञान मंच है जो जैनधर्म की समृद्ध परंपरा को संरक्षित और साझा करने के लिए समर्पित है। यहाँ सभी 24 तीर्थंकरों, पवित्र साहित्य, भजन, आरती, जैन दर्शन, संस्कृति और समुदाय की जानकारी उपलब्ध है। हमारा लक्ष्य है कि जैन ज्ञान सभी तक पहुंचे।',
      'JainWorld is a free Jain knowledge platform dedicated to preserving and sharing the rich traditions of Jainism. Here you will find information on all 24 Tirthankaras, sacred literature, bhajans, aartis, Jain philosophy, culture, and community resources. Our mission is to make Jain knowledge accessible to all.'
    )}</p>
  </div>`;

  res.send(layout('/', t('मुख्य पृष्ठ','Home'), body));
});

// ── TIRTHANKARAS LIST ─────────────────────────────────────────────────────────
app.get('/tirthankaras', (req, res) => {
  const { tirthankaras = [] } = db();
  const cards = tirthankaras.map(tirtha => {
    const hiName = T_HI_NAMES[tirtha.id] || tirtha.name;
    return `<a href="/tirthankaras/${esc(tirtha.id)}" class="tirtha-card">
      <div class="tirtha-num">${tirtha.order}.</div>
      <div class="tirtha-name">${esc(tirtha.name)}</div>
      <div class="tirtha-hi">${esc(hiName)}</div>
      <div class="tirtha-sym">${t('चिह्न','Symbol')}: ${esc(tirtha.symbol)}</div>
    </a>`;
  }).join('');

  const body = `
  ${pageTitle('तीर्थंकर','Tirthankaras','जैनधर्म के 24 तीर्थंकर','All 24 Enlightened Jinas of Jainism')}
  <div class="tirtha-grid">${cards}</div>`;
  res.send(layout('/tirthankaras', 'Tirthankaras | तीर्थंकर', body));
});

// ── TIRTHANKARA DETAIL ────────────────────────────────────────────────────────
app.get('/tirthankaras/:id', (req, res) => {
  const { tirthankaras = [] } = db();
  const item = tirthankaras.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/tirthankaras', 'Not Found', '<div class="empty-state">Not found.</div>'));
  const hiName = T_HI_NAMES[item.id] || item.name;

  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/tirthankaras',label:t('तीर्थंकर','Tirthankaras')},{label:item.name}])}
  <div class="detail-header">
    <h1>${esc(item.name)}</h1>
    <div style="font-size:1.1rem;color:#d97706;margin-top:4px;">${esc(hiName)}</div>
    <div style="margin-top:8px;">${badge(item.order + 'वें तीर्थंकर / ' + item.order + (item.order===1?'st':item.order===2?'nd':item.order===3?'rd':'th') + ' Tirthankara')}</div>
  </div>
  <div class="detail-grid">
    <div>
      <div class="detail-section">
        <h2>${t('विवरण','Details')}</h2>
        <table class="info-table">
          <tr><td>${t('क्रम','Order')}</td><td>${item.order}</td></tr>
          <tr><td>${t('चिह्न','Symbol')}</td><td>${esc(item.symbol)}</td></tr>
          <tr><td>${t('वर्ण','Color')}</td><td>${esc(item.color)}</td></tr>
          <tr><td>${t('जन्म स्थान','Birth Place')}</td><td>${esc(item.birthPlace)}</td></tr>
          <tr><td>${t('युग','Era')}</td><td>${esc(item.epoch)}</td></tr>
        </table>
      </div>
    </div>
    <div>
      <div class="detail-section">
        <h2>${t('जीवन कथा','Life Story')}</h2>
        <div class="detail-body"><p>${esc(item.lifeStory)}</p></div>
      </div>
      <div class="detail-section" style="margin-top:20px;">
        <h2>${t('उपदेश','Teachings')}</h2>
        <div class="detail-body"><p>${esc(item.teachings)}</p></div>
      </div>
    </div>
  </div>`;
  res.send(layout('/tirthankaras', item.name, body));
});

// ── LITERATURE LIST ───────────────────────────────────────────────────────────
app.get('/literature', (req, res) => {
  const { literature = [] } = db();
  const items = literature.map(item => `
    <div class="divider-item">
      <div class="divider-title"><a href="/literature/${esc(item.id)}">${esc(item.title)}</a></div>
      <div class="divider-meta">${badge(item.category)} <span class="meta-date">${esc(item.publishedAt ?? '')}</span></div>
      <div class="divider-body">${esc(item.summary)}</div>
      ${tagList(item.tags)}
    </div>`).join('');
  const body = `
  ${pageTitle('साहित्य','Literature','जैन आगम, शास्त्र और दार्शनिक ग्रंथ','Jain Agamas, Scriptures & Philosophical Texts')}
  <div class="divider-list">${items}</div>`;
  res.send(layout('/literature', 'Literature | साहित्य', body));
});

// ── LITERATURE DETAIL ─────────────────────────────────────────────────────────
app.get('/literature/:id', (req, res) => {
  const { literature = [] } = db();
  const item = literature.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/literature','Not Found','<div class="empty-state">Not found.</div>'));
  const paras = (item.content||'').split('\n\n').map(p => `<p>${esc(p)}</p>`).join('');
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/literature',label:t('साहित्य','Literature')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${badge(item.category)} <span class="meta-date">${esc(item.publishedAt??'')}</span></div>
    <h1>${esc(item.title)}</h1>
    <p class="subtitle">${esc(item.summary)}</p>
  </div>
  <div class="detail-body">${paras}</div>
  ${tagList(item.tags)}`;
  res.send(layout('/literature', item.title, body));
});

// ── BHAJANS LIST ──────────────────────────────────────────────────────────────
app.get('/bhajans', (req, res) => {
  const { bhajans = [] } = db();
  const items = bhajans.map(item => `
    <a href="/bhajans/${esc(item.id)}" class="list-card">
      <div class="list-card-title">${esc(item.title)}</div>
      <div class="list-card-sub">${t('देवता','Deity')}: ${esc(item.deity)} &nbsp;|&nbsp; ${t('भाषा','Language')}: ${esc(item.language)}</div>
      <div class="list-card-text">${esc((item.meaning||'').slice(0,120))}...</div>
    </a>`).join('');
  const body = `
  ${pageTitle('भजन','Bhajans','जैन भक्ति गीत और स्तुति','Jain Devotional Songs & Hymns')}
  <div class="list-grid">${items}</div>`;
  res.send(layout('/bhajans', 'Bhajans | भजन', body));
});

// ── BHAJAN DETAIL ─────────────────────────────────────────────────────────────
app.get('/bhajans/:id', (req, res) => {
  const { bhajans = [] } = db();
  const item = bhajans.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/bhajans','Not Found','<div class="empty-state">Not found.</div>'));
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/bhajans',label:t('भजन','Bhajans')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${badge(item.deity)} ${badge(item.language,'badge-purple')}</div>
    <h1>${esc(item.title)}</h1>
  </div>
  <div class="detail-grid">
    <div>
      <div class="detail-section">
        <h2>${t('पाठ / गीत','Lyrics')}</h2>
        <div class="lyrics-box">${esc(item.lyrics)}</div>
      </div>
    </div>
    <div>
      <div class="detail-section">
        <h2>${t('अर्थ','Meaning')}</h2>
        <div class="detail-body"><p>${esc(item.meaning)}</p></div>
      </div>
    </div>
  </div>
  ${tagList(item.tags)}`;
  res.send(layout('/bhajans', item.title, body));
});

// ── AARTIS LIST ───────────────────────────────────────────────────────────────
app.get('/aartis', (req, res) => {
  const { aartis = [] } = db();
  const items = aartis.map(item => `
    <a href="/aartis/${esc(item.id)}" class="list-card">
      <div class="list-card-title">${esc(item.title)}</div>
      <div class="list-card-sub">${t('देवता','Deity')}: ${esc(item.deity)}</div>
      <div class="list-card-text">${esc((item.meaning||'').slice(0,120))}...</div>
    </a>`).join('');
  const body = `
  ${pageTitle('आरती','Aartis','जैन पूजा और आराधना','Jain Ritual Prayers & Worship')}
  <div class="list-grid">${items}</div>`;
  res.send(layout('/aartis', 'Aartis | आरती', body));
});

// ── AARTI DETAIL ──────────────────────────────────────────────────────────────
app.get('/aartis/:id', (req, res) => {
  const { aartis = [] } = db();
  const item = aartis.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/aartis','Not Found','<div class="empty-state">Not found.</div>'));
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/aartis',label:t('आरती','Aartis')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${badge(item.deity)}</div>
    <h1>${esc(item.title)}</h1>
  </div>
  <div class="detail-grid">
    <div>
      <div class="detail-section">
        <h2>${t('आरती पाठ','Aarti Lyrics')}</h2>
        <div class="lyrics-box">${esc(item.lyrics)}</div>
      </div>
    </div>
    <div>
      <div class="detail-section">
        <h2>${t('अर्थ','Meaning')}</h2>
        <div class="detail-body"><p>${esc(item.meaning)}</p></div>
      </div>
    </div>
  </div>`;
  res.send(layout('/aartis', item.title, body));
});

// ── POEMS LIST ────────────────────────────────────────────────────────────────
app.get('/poems', (req, res) => {
  const { poems = [] } = db();
  const items = poems.map(item => `
    <a href="/poems/${esc(item.id)}" class="list-card">
      <div class="list-card-title">${esc(item.title)}</div>
      <div class="list-card-sub">${item.author ? t('कवि','Author') + ': ' + esc(item.author) : ''} ${item.type ? badge(item.type) : ''}</div>
      <div class="list-card-text" style="font-family:monospace;font-size:12px;">${esc((item.content||'').slice(0,100))}...</div>
    </a>`).join('');
  const body = `
  ${pageTitle('कविताएं','Poems','जैन भक्ति एवं दार्शनिक कविताएं','Jain Devotional & Philosophical Poetry')}
  <div class="list-grid">${items}</div>`;
  res.send(layout('/poems', 'Poems | कविताएं', body));
});

// ── POEM DETAIL ───────────────────────────────────────────────────────────────
app.get('/poems/:id', (req, res) => {
  const { poems = [] } = db();
  const item = poems.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/poems','Not Found','<div class="empty-state">Not found.</div>'));
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/poems',label:t('कविताएं','Poems')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${item.type?badge(item.type):''} ${item.author?`<span class="meta-source">${t('कवि','By')}: ${esc(item.author)}</span>`:''}</div>
    <h1>${esc(item.title)}</h1>
  </div>
  <div class="detail-grid">
    <div>
      <div class="detail-section">
        <h2>${t('कविता','Poem')}</h2>
        <div class="lyrics-box">${esc(item.content)}</div>
      </div>
    </div>
    ${item.meaning ? `<div>
      <div class="detail-section">
        <h2>${t('अर्थ','Meaning')}</h2>
        <div class="detail-body"><p>${esc(item.meaning)}</p></div>
      </div>
    </div>` : ''}
  </div>`;
  res.send(layout('/poems', item.title, body));
});

// ── CULTURE LIST ──────────────────────────────────────────────────────────────
app.get('/culture', (req, res) => {
  const { culture = [] } = db();
  const items = culture.map(item => `
    <div class="divider-item">
      <div class="divider-title"><a href="/culture/${esc(item.id)}">${esc(item.title)}</a></div>
      <div class="divider-meta">${badge(item.category)} <span class="meta-date">${esc(item.publishedAt??'')}</span></div>
      <div class="divider-body">${esc(item.summary)}</div>
      ${tagList(item.tags)}
    </div>`).join('');
  const body = `
  ${pageTitle('संस्कृति','Culture','जैन त्योहार, भोजन और परंपराएं','Jain Festivals, Food & Traditions')}
  <div class="divider-list">${items}</div>`;
  res.send(layout('/culture', 'Culture | संस्कृति', body));
});

// ── CULTURE DETAIL ────────────────────────────────────────────────────────────
app.get('/culture/:id', (req, res) => {
  const { culture = [] } = db();
  const item = culture.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/culture','Not Found','<div class="empty-state">Not found.</div>'));
  const paras = (item.content||'').split('\n\n').map(p => `<p>${esc(p)}</p>`).join('');
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/culture',label:t('संस्कृति','Culture')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${badge(item.category)} <span class="meta-date">${esc(item.publishedAt??'')}</span></div>
    <h1>${esc(item.title)}</h1>
    <p class="subtitle">${esc(item.summary)}</p>
  </div>
  <div class="detail-body">${paras}</div>
  ${tagList(item.tags)}`;
  res.send(layout('/culture', item.title, body));
});

// ── PHILOSOPHY LIST ───────────────────────────────────────────────────────────
app.get('/philosophy', (req, res) => {
  const { philosophy = [] } = db();
  const items = philosophy.map(item => `
    <div class="divider-item">
      <div class="divider-title"><a href="/philosophy/${esc(item.id)}">${esc(item.title)}</a></div>
      <div class="divider-meta">${badge(item.category)}</div>
      <div class="divider-body">${esc(item.summary)}</div>
      ${tagList(item.tags)}
    </div>`).join('');
  const body = `
  ${pageTitle('दर्शन','Philosophy','जैन दार्शनिक सिद्धांत: अहिंसा, अनेकांतवाद, कर्म, मोक्ष','Core Concepts: Ahimsa, Anekantavada, Karma, Moksha')}
  <div class="divider-list">${items}</div>`;
  res.send(layout('/philosophy', 'Philosophy | दर्शन', body));
});

// ── PHILOSOPHY DETAIL ─────────────────────────────────────────────────────────
app.get('/philosophy/:id', (req, res) => {
  const { philosophy = [] } = db();
  const item = philosophy.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/philosophy','Not Found','<div class="empty-state">Not found.</div>'));
  const paras = (item.content||'').split('\n\n').map(p => `<p>${esc(p)}</p>`).join('');
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/philosophy',label:t('दर्शन','Philosophy')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${badge(item.category)}</div>
    <h1>${esc(item.title)}</h1>
    <p class="subtitle">${esc(item.summary)}</p>
  </div>
  <div class="detail-body">${paras}</div>
  ${tagList(item.tags)}`;
  res.send(layout('/philosophy', item.title, body));
});

// ── NEWS LIST ─────────────────────────────────────────────────────────────────
app.get('/news', (req, res) => {
  const { news = [] } = db();
  const items = news.map(item => `
    <div class="divider-item">
      <div class="divider-meta">${badge(item.category,'badge-blue')} <span class="meta-date">${esc(item.publishedAt??'')}</span> ${item.source?`<span class="meta-source">— ${esc(item.source)}</span>`:''}</div>
      <div class="divider-title"><a href="/news/${esc(item.id)}">${esc(item.title)}</a></div>
      <div class="divider-body" style="margin-top:4px;">${esc(item.summary)}</div>
    </div>`).join('');
  const body = `
  ${pageTitle('समाचार','News','जैन जगत की ताजा खबरें','Latest news from the Jain community worldwide')}
  <div class="divider-list">${items}</div>`;
  res.send(layout('/news', 'News | समाचार', body));
});

// ── NEWS DETAIL ───────────────────────────────────────────────────────────────
app.get('/news/:id', (req, res) => {
  const { news = [] } = db();
  const item = news.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/news','Not Found','<div class="empty-state">Not found.</div>'));
  const paras = (item.content||'').split('\n\n').map(p => `<p>${esc(p)}</p>`).join('');
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/news',label:t('समाचार','News')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${badge(item.category,'badge-blue')} <span class="meta-date">${esc(item.publishedAt??'')}</span> ${item.source?`<span class="meta-source">— ${esc(item.source)}</span>`:''}</div>
    <h1>${esc(item.title)}</h1>
    <p class="subtitle">${esc(item.summary)}</p>
  </div>
  <div class="detail-body">${paras}</div>`;
  res.send(layout('/news', item.title, body));
});

// ── BLOG LIST ─────────────────────────────────────────────────────────────────
app.get('/blog', (req, res) => {
  const { blog = [] } = db();
  const items = blog.map(item => `
    <div class="divider-item">
      <div class="divider-meta">${badge(item.category,'badge-green')} <span class="meta-date">${esc(item.publishedAt??'')}</span> ${item.readTime?`<span class="meta-source">${esc(item.readTime)} read</span>`:''}</div>
      <div class="divider-title"><a href="/blog/${esc(item.id)}">${esc(item.title)}</a></div>
      ${item.author?`<div style="font-size:12px;color:#737373;margin:2px 0;">${t('लेखक','By')}: ${esc(item.author)}</div>`:''}
      <div class="divider-body" style="margin-top:4px;">${esc(item.summary)}</div>
      ${tagList(item.tags)}
    </div>`).join('');
  const body = `
  ${pageTitle('ब्लॉग','Blog','जैन जीवन, स्वास्थ्य, आध्यात्मिकता और समुदाय पर लेख','Articles on Jain Life, Health, Spirituality & Community')}
  <div class="divider-list">${items}</div>`;
  res.send(layout('/blog', 'Blog | ब्लॉग', body));
});

// ── BLOG DETAIL ───────────────────────────────────────────────────────────────
app.get('/blog/:id', (req, res) => {
  const { blog = [] } = db();
  const item = blog.find(x => x.id === req.params.id);
  if (!item) return res.status(404).send(layout('/blog','Not Found','<div class="empty-state">Not found.</div>'));
  const paras = (item.content||'').split('\n\n').map(p => `<p>${esc(p)}</p>`).join('');
  const body = `
  ${breadcrumb([{href:'/',label:t('मुख्य','Home')},{href:'/blog',label:t('ब्लॉग','Blog')},{label:item.title}])}
  <div class="detail-header">
    <div class="divider-meta">${badge(item.category,'badge-green')} <span class="meta-date">${esc(item.publishedAt??'')}</span> ${item.readTime?`<span class="meta-source">${esc(item.readTime)} read</span>`:''}</div>
    <h1>${esc(item.title)}</h1>
    ${item.author?`<div style="font-size:13px;color:#737373;margin-top:4px;">${t('लेखक','By')} <strong>${esc(item.author)}</strong></div>`:''}
    <p class="subtitle">${esc(item.summary)}</p>
  </div>
  <div class="detail-body">${paras}</div>
  ${tagList(item.tags)}`;
  res.send(layout('/blog', item.title, body));
});

// ── COMMUNITY HOME ────────────────────────────────────────────────────────────
app.get('/community', (req, res) => {
  const links = [
    { href: '/community/members', hi: 'सदस्य प्रोफाइल', en: 'Member Profiles', dhi: 'विश्व भर के जैन समुदाय के सदस्यों से जुड़ें', den: 'Connect with Jain community members worldwide' },
    { href: '/community/jobs', hi: 'नौकरी बोर्ड', en: 'Job Board', dhi: 'जैन-अनुकूल रोजगार के अवसर', den: 'Jain-friendly job opportunities' },
    { href: '/community/businesses', hi: 'व्यापार निर्देशिका', en: 'Business Directory', dhi: 'जैन व्यवसाय और सेवाएं', den: 'Jain businesses and services' },
    { href: '/community/leads', hi: 'व्यापार अवसर', en: 'Business Leads', dhi: 'व्यापार भागीदारी और अवसर', den: 'Business opportunities and partnerships' },
  ];
  const cards = links.map(l => `
    <a href="${l.href}" class="comm-card">
      <h2>${t(l.hi, l.en)}</h2>
      <p>${t(l.dhi, l.den)}</p>
    </a>`).join('');
  const body = `
  ${pageTitle('समुदाय','Community','वैश्विक जैन समुदाय से जुड़ें','Connect with the global Jain community')}
  <div class="comm-grid">${cards}</div>`;
  res.send(layout('/community', 'Community | समुदाय', body));
});

// ── MEMBERS ───────────────────────────────────────────────────────────────────
app.get('/community/members', (req, res) => {
  const data = db();
  const members = data.members || data.community?.members || [];
  const cards = members.map(m => `
    <div class="member-card">
      <div class="member-avatar">${esc(m.name.charAt(0))}</div>
      <div class="member-info">
        <div class="member-name">${esc(m.name)}</div>
        <div class="member-location">${esc(m.location)}</div>
      </div>
      <div class="member-meta">${badge(m.profession,'badge-blue')}</div>
      <div class="member-bio">${esc(m.bio)}</div>
      <div style="font-size:11px;color:#a3a3a3;margin-top:6px;">${t('सदस्य since','Member since')} ${esc(m.joined)}</div>
    </div>`).join('');
  const body = `
  ${breadcrumb([{href:'/community',label:t('समुदाय','Community')},{label:t('सदस्य','Members')}])}
  ${pageTitle('सदस्य प्रोफाइल','Member Profiles','विश्व भर के जैन समुदाय के सदस्य','Jain community members from around the world')}
  <div class="member-grid">${cards}</div>`;
  res.send(layout('/community', 'Members | सदस्य', body));
});

// ── JOBS ──────────────────────────────────────────────────────────────────────
app.get('/community/jobs', (req, res) => {
  const data = db();
  const jobs = data.jobs || data.community?.jobs || [];
  const items = jobs.map(j => `
    <div class="divider-item">
      <div class="divider-title">${esc(j.title)}</div>
      <div class="divider-meta">
        <strong style="font-size:13px;">${esc(j.company)}</strong>
        <span class="meta-source">— ${esc(j.location)}</span>
        ${j.type ? badge(j.type) : ''}
        <span class="meta-date">${t('पोस्ट','Posted')}: ${esc(j.postedAt??'')}</span>
      </div>
      <div class="divider-body">${esc(j.description)}</div>
      ${j.contact ? `<div style="font-size:12px;color:#d97706;margin-top:6px;">${t('संपर्क','Contact')}: ${esc(j.contact)}</div>` : ''}
    </div>`).join('');
  const body = `
  ${breadcrumb([{href:'/community',label:t('समुदाय','Community')},{label:t('नौकरियां','Jobs')}])}
  ${pageTitle('नौकरी बोर्ड','Job Board','जैन-अनुकूल रोजगार के अवसर','Jain-friendly job opportunities')}
  <div class="divider-list">${items}</div>`;
  res.send(layout('/community', 'Jobs | नौकरियां', body));
});

// ── BUSINESSES ────────────────────────────────────────────────────────────────
app.get('/community/businesses', (req, res) => {
  const data = db();
  const businesses = data.businesses || data.community?.businesses || [];
  const items = businesses.map(b => `
    <div class="list-card" style="display:block;padding:16px;border:1px solid #e5e5e5;border-radius:3px;margin-bottom:12px;">
      <div class="list-card-title" style="font-size:15px;">${esc(b.name)}</div>
      <div class="divider-meta" style="margin-top:4px;">${badge(b.category,'badge-blue')} <span class="meta-source">${esc(b.location)}</span></div>
      <div class="divider-body" style="margin-top:8px;">${esc(b.description)}</div>
      <div style="font-size:12px;color:#525252;margin-top:8px;display:flex;gap:16px;flex-wrap:wrap;">
        <span>${t('संपर्क','Contact')}: ${esc(b.contact)}</span>
        ${b.website ? `<span>${t('वेबसाइट','Website')}: <a href="${esc(b.website)}" style="color:#d97706;">${esc(b.website)}</a></span>` : ''}
        ${b.established ? `<span>${t('स्थापित','Est')}: ${esc(b.established)}</span>` : ''}
      </div>
    </div>`).join('');
  const body = `
  ${breadcrumb([{href:'/community',label:t('समुदाय','Community')},{label:t('व्यापार','Businesses')}])}
  ${pageTitle('व्यापार निर्देशिका','Business Directory','जैन व्यवसाय और सेवाएं','Jain businesses and services')}
  ${items}`;
  res.send(layout('/community', 'Businesses | व्यापार', body));
});

// ── LEADS ─────────────────────────────────────────────────────────────────────
app.get('/community/leads', (req, res) => {
  const data = db();
  const leads = data.leads || data.community?.leads || [];
  const items = leads.map(l => `
    <div class="divider-item">
      <div class="divider-title">${esc(l.title)}</div>
      <div class="divider-meta">
        ${badge(l.category)}
        ${l.location ? `<span class="meta-source">${esc(l.location)}</span>` : ''}
        ${l.budget ? badge(l.budget,'badge-green') : ''}
        <span class="meta-date">${t('पोस्ट','Posted')}: ${esc(l.postedAt??'')}</span>
      </div>
      <div class="divider-body">${esc(l.description)}</div>
      ${l.contact ? `<div style="font-size:12px;color:#d97706;margin-top:6px;">${t('संपर्क','Contact')}: ${esc(l.contact)}</div>` : ''}
    </div>`).join('');
  const body = `
  ${breadcrumb([{href:'/community',label:t('समुदाय','Community')},{label:t('व्यापार अवसर','Business Leads')}])}
  ${pageTitle('व्यापार अवसर','Business Leads','व्यापार भागीदारी और अवसर सूची','Business opportunities and partnership listings')}
  <div class="divider-list">${items}</div>`;
  res.send(layout('/community', 'Business Leads | व्यापार अवसर', body));
});

// ── SEARCH ────────────────────────────────────────────────────────────────────
app.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  let results = [];

  if (q) {
    const data = db();
    const addResults = (items, type, urlFn, titleFn, summaryFn) => {
      (items || []).forEach(item => {
        const text = [titleFn(item), summaryFn(item)].join(' ').toLowerCase();
        if (text.includes(q)) {
          results.push({ type, url: urlFn(item), title: titleFn(item), summary: summaryFn(item) });
        }
      });
    };

    addResults(data.tirthankaras, t('तीर्थंकर','Tirthankara'),
      x => `/tirthankaras/${x.id}`, x => x.name, x => x.lifeStory?.slice(0,120));
    addResults(data.literature, t('साहित्य','Literature'),
      x => `/literature/${x.id}`, x => x.title, x => x.summary);
    addResults(data.bhajans, t('भजन','Bhajan'),
      x => `/bhajans/${x.id}`, x => x.title, x => x.meaning?.slice(0,120));
    addResults(data.aartis, t('आरती','Aarti'),
      x => `/aartis/${x.id}`, x => x.title, x => x.meaning?.slice(0,120));
    addResults(data.poems, t('कविता','Poem'),
      x => `/poems/${x.id}`, x => x.title, x => x.content?.slice(0,120));
    addResults(data.culture, t('संस्कृति','Culture'),
      x => `/culture/${x.id}`, x => x.title, x => x.summary);
    addResults(data.philosophy, t('दर्शन','Philosophy'),
      x => `/philosophy/${x.id}`, x => x.title, x => x.summary);
    addResults(data.news, t('समाचार','News'),
      x => `/news/${x.id}`, x => x.title, x => x.summary);
    addResults(data.blog, t('ब्लॉग','Blog'),
      x => `/blog/${x.id}`, x => x.title, x => x.summary);
    const members = data.members || data.community?.members || [];
    addResults(members, t('सदस्य','Member'),
      x => '/community/members', x => x.name, x => x.bio?.slice(0,100));
  }

  const typeColors = {
    Tirthankara: 'badge-blue', Bhajan: 'badge-purple', Aarti: 'badge-purple',
    Blog: 'badge-green', News: 'badge-blue',
  };

  const resultItems = results.map(r => `
    <div class="result-item">
      <div class="result-badge-col">${badge(r.type, typeColors[r.type] || '')}</div>
      <div class="result-body-col">
        <div class="result-title"><a href="${r.url}">${esc(r.title)}</a></div>
        <div class="result-summary">${esc(r.summary || '')}</div>
      </div>
    </div>`).join('');

  const body = `
  ${pageTitle('खोज','Search','सभी जैन सामग्री में खोजें','Search across all Jain content')}
  <form class="search-form" action="/search" method="get" style="justify-content:flex-start;margin-bottom:20px;">
    <input type="search" name="q" value="${esc(req.query.q||'')}" placeholder="खोजें..." style="max-width:460px;">
    <button type="submit" class="btn-amber">${t('खोजें','Search')}</button>
  </form>
  ${q ? `<div class="search-results-count">
    ${results.length} ${t('परिणाम मिले','result(s) found')} "${esc(req.query.q||'')}" ${t('के लिए','for')}
  </div>` : ''}
  ${q && results.length === 0 ? `<div class="empty-state">${t('कोई परिणाम नहीं मिला। कोई अन्य शब्द खोजें।','No results found. Try a different search term.')}</div>` : ''}
  ${resultItems}
  ${!q ? `<div class="empty-state">${t('खोज शब्द दर्ज करें — तीर्थंकर, भजन, दर्शन, समाचार आदि।','Enter a search term — Tirthankaras, bhajans, philosophy, news, and more.')}</div>` : ''}`;
  res.send(layout('/search', 'Search | खोज', body));
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  const body = `
  <div class="empty-state" style="padding:80px 16px;">
    <div style="font-size:2rem;font-weight:700;color:#d97706;margin-bottom:12px;">404</div>
    <p>${t('पृष्ठ नहीं मिला','Page not found')}</p>
    <a href="/" style="color:#d97706;margin-top:12px;display:inline-block;">${t('मुख्य पृष्ठ पर जाएं','Go to Home')}</a>
  </div>`;
  res.status(404).send(layout('/', '404', body));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JainWorld running on port ${PORT}`);
});
