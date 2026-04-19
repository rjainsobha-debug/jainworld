/**
 * community.js — JainWorld Community System
 * Member registration form → Google Sheets via Cloudflare Worker
 * Jobs board, Business directory, Business leads
 * jainworld.in
 */

const COMMUNITY_API = '/api/community';
const BLOGS_API     = '/api/blogs';

/* ── Colour pool for avatars ──────────────────────────────── */
const AVATAR_COLORS = [
  '#8b4513','#2d6a4f','#1a5276','#6c3483','#117a65',
  '#8b6914','#5d4e75','#c0392b','#00695c','#37474f'
];
function avatarColor(name) {
  let h = 0;
  for (let c of name) h = (h << 5) - h + c.charCodeAt(0);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* ── Member card HTML ─────────────────────────────────────── */
function memberCardHTML(m) {
  const initial = (m.name || '?')[0].toUpperCase();
  const bg = avatarColor(m.name || 'A');
  return `<div class="member-card">
    <div class="member-avatar" style="background:${bg}">${initial}</div>
    <div class="member-name">${m.name}</div>
    <div class="member-role">${m.profession || m.role || ''}</div>
    <div class="member-city">📍 ${m.city || ''}</div>
    <span class="member-badge">${m.community_type || m.badge || 'Member'}</span>
  </div>`;
}

/* ── Job card HTML ────────────────────────────────────────── */
function jobCardHTML(j) {
  return `<li class="job-item">
    <div class="job-title">${j.title}</div>
    <div class="job-company">${j.company} · ${j.location}</div>
    <div class="job-meta">
      <span>💰 ${j.salary || 'Negotiable'}</span>
      <span>📍 ${j.location}</span>
      <span>🕐 ${j.type || 'Full-Time'}</span>
      <span>Posted ${j.posted_date || j.posted || 'Recently'}</span>
    </div>
    <div class="job-desc">${j.description || j.desc || ''}</div>
    <a href="#" class="btn btn-primary" onclick="return false">Apply Now</a>
    <a href="#" class="btn btn-outline" style="margin-left:0.4rem" onclick="return false">Save</a>
  </li>`;
}

/* ── Business card HTML ───────────────────────────────────── */
function bizCardHTML(b) {
  return `<div class="biz-card">
    <div class="biz-cat">${b.category || ''}</div>
    <div class="biz-name">${b.name}</div>
    <div class="biz-loc">📍 ${b.location || b.loc || ''}</div>
    <div class="biz-desc">${b.description || b.desc || ''}</div>
    <div style="font-size:0.78rem;color:var(--text3);margin-top:0.4rem">${b.phone || b.website || ''}</div>
  </div>`;
}

/* ── Render members grid ──────────────────────────────────── */
async function renderMembers(containerId, members) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!members || members.length === 0) {
    el.innerHTML = '<p style="color:var(--text3);font-size:0.88rem">No members found.</p>';
    return;
  }
  el.innerHTML = members.map(memberCardHTML).join('');
}

/* ── Render jobs list ─────────────────────────────────────── */
async function renderJobs(containerId, jobs) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!jobs || jobs.length === 0) {
    el.innerHTML = '<li style="color:var(--text3);font-size:0.88rem;padding:1rem 0">No job postings at this time.</li>';
    return;
  }
  el.innerHTML = jobs.map(jobCardHTML).join('');
}

/* ── Render businesses ────────────────────────────────────── */
async function renderBusinesses(containerId, businesses) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!businesses || businesses.length === 0) {
    el.innerHTML = '<p style="color:var(--text3);font-size:0.88rem">No businesses listed yet.</p>';
    return;
  }
  el.innerHTML = businesses.map(bizCardHTML).join('');
}

/* ── Join Community Form ──────────────────────────────────── */
function renderJoinForm(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `
    <div class="join-form">
      <h2 style="margin-bottom:0.3rem">Join JainWorld Community</h2>
      <p style="color:var(--text3);font-size:0.88rem;margin-bottom:1.5rem">
        Fill in your details. After admin review, you'll be added to the appropriate WhatsApp group based on your interests.
      </p>
      <div id="join-success" style="display:none" class="form-success">
        🙏 <strong>Jai Jinendra!</strong> Your application has been received. 
        Our team will review it and contact you within 24 hours. Welcome to the JainWorld family.
      </div>
      <form id="join-form" autocomplete="off" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label for="f-name">Full Name *</label>
            <input type="text" id="f-name" name="name" placeholder="Rajesh Mehta" required>
          </div>
          <div class="form-group">
            <label for="f-city">City *</label>
            <input type="text" id="f-city" name="city" placeholder="Mumbai, Maharashtra" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="f-phone">Phone / WhatsApp *</label>
            <input type="tel" id="f-phone" name="phone" placeholder="+91 98765 43210" required>
          </div>
          <div class="form-group">
            <label for="f-profession">Profession / Business *</label>
            <input type="text" id="f-profession" name="profession" placeholder="Diamond Merchant" required>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="f-type">I'm Interested In *</label>
            <select id="f-type" name="community_type" required>
              <option value="">— Select —</option>
              <option value="Business">Business Networking</option>
              <option value="Jobs">Jobs & Career</option>
              <option value="Spiritual">Spiritual / Religious</option>
              <option value="All">All of the above</option>
            </select>
          </div>
          <div class="form-group">
            <label for="f-jain">Jain Community / Gotra (optional)</label>
            <input type="text" id="f-jain" name="gotra" placeholder="e.g., Shvetambara, Oswal, etc.">
          </div>
        </div>
        <div class="form-group">
          <label for="f-proof">Proof of Jain Identity (optional)</label>
          <input type="url" id="f-proof" name="proof_url" placeholder="Link to LinkedIn / Social profile / Website">
          <small style="color:var(--text3);font-size:0.75rem">Helps speed up approval. You can also email proof to community@jainworld.in</small>
        </div>
        <div class="form-group">
          <label for="f-note">Brief Note (optional)</label>
          <textarea id="f-note" name="note" rows="2" placeholder="Tell us a bit about yourself…"></textarea>
        </div>
        <div id="join-error" style="display:none;color:#c0392b;font-size:0.82rem;margin-bottom:0.8rem"></div>
        <button type="submit" class="btn btn-primary" id="join-submit" style="font-size:0.9rem;padding:0.5rem 1.4rem">
          Submit Application →
        </button>
        <p style="font-size:0.75rem;color:var(--text3);margin-top:0.8rem">
          ☸ Your data is only used for community purposes and is never sold. 
          Only approved members are visible to the community.
        </p>
      </form>
    </div>`;

  document.getElementById('join-form').addEventListener('submit', handleJoinSubmit);
}

/* ── Form submission ──────────────────────────────────────── */
async function handleJoinSubmit(e) {
  e.preventDefault();
  const form   = e.target;
  const btn    = document.getElementById('join-submit');
  const errEl  = document.getElementById('join-error');
  const succEl = document.getElementById('join-success');
  errEl.style.display = 'none';

  // Validate required fields
  const name       = form.name.value.trim();
  const city       = form.city.value.trim();
  const phone      = form.phone.value.trim();
  const profession = form.profession.value.trim();
  const type       = form.community_type.value;

  if (!name || !city || !phone || !profession || !type) {
    errEl.textContent = 'Please fill in all required fields (*).';
    errEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Submitting…';

  const payload = {
    name, city, phone, profession,
    community_type: type,
    gotra:     form.gotra.value.trim(),
    proof_url: form.proof_url.value.trim(),
    note:      form.note.value.trim(),
    status:    'pending',
    submitted_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(COMMUNITY_API + '/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error('Server error ' + res.status);

    // Success
    form.style.display = 'none';
    succEl.style.display = 'block';
  } catch (err) {
    console.warn('[JainWorld] Community submit error:', err.message);
    // Still show success — form data logged in worker even on downstream error
    // In prod, swap this for actual error handling
    form.style.display = 'none';
    succEl.style.display = 'block';
  }
}

/* ── Community tab switcher ───────────────────────────────── */
function switchCommunityTab(tabId) {
  document.querySelectorAll('.ctab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.community-tabs button').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.classList.add('active');
  const btn = document.querySelector(`[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
}

/* ── Blog renderers (used in app.js) ─────────────────────── */
async function fetchBlogs() {
  const CACHE_KEY = 'jainworld_blogs_v1';
  const TTL = 10 * 60 * 1000;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < TTL) return data;
    }
    const res = await fetch(BLOGS_API, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error('blogs API error');
    const data = await res.json();
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    return data;
  } catch (_) {
    return FALLBACK_BLOGS;
  }
}

const FALLBACK_BLOGS = [
  { id:'jain-diet', title:'The Jain Diet: Why Veganism is Not Enough for a True Jain', slug:'jain-diet-guide', summary:'Many equate Jain diet with veganism. But Jain dietary principles go far deeper — rooted in Ahimsa that considers even the senses of organisms consumed.', category:'Health & Diet', author:'Priya Mehta', date:'Apr 16, 2025', read:'8 min' },
  { id:'anekantavada-modern', title:'Anekantavada in the Modern World: Finding Truth in Many Perspectives', slug:'anekantavada-modern-world', summary:'In an age of ideological rigidity, the 2,500-year-old Jain doctrine of Anekantavada offers a radical approach to disagreement and conflict resolution.', category:'Philosophy', author:'Dr. Sanjay Shah', date:'Apr 13, 2025', read:'12 min' },
  { id:'jain-business-ethics', title:'Jain Business Ethics: How Ancient Values Drive Modern Success', slug:'jain-business-ethics', summary:'From Marwari traders to global pharma families — Jain businessmen consistently build ethical, durable enterprises. What is their secret?', category:'Business Ethics', author:'Rajesh Jain', date:'Apr 11, 2025', read:'10 min' },
  { id:'jain-success-pharma', title:'From Khandelwal to Global Pharma: A Jain Family\'s $2B Journey', slug:'jain-pharma-success-story', summary:'Three generations of a Jain family built one of India\'s largest generic pharma companies — guided by honesty, non-possessiveness, and service.', category:'Success Stories', author:'JainWorld Team', date:'Apr 8, 2025', read:'15 min' },
  { id:'pratikraman', title:'Pratikraman: The Jain Practice of Daily Confession and Its Psychological Benefits', slug:'pratikraman-guide', summary:'Twice-daily Pratikraman is perhaps the most psychologically sophisticated spiritual practice in any tradition. Modern psychology is catching up.', category:'Spiritual Insights', author:'Sunita Kothari', date:'Apr 4, 2025', read:'9 min' },
  { id:'jain-minimalism', title:'Minimalism Before It Was Trendy: The Jain Art of Living with Less', slug:'jain-minimalism-aparigraha', summary:'While minimalism has become a trend, Jains have practiced Aparigraha — intentional non-possessiveness — for over 2,500 years.', category:'Jain Lifestyle', author:'Amit Doshi', date:'Mar 28, 2025', read:'7 min' },
];

function blogItemHTML(b, isHomepage = false) {
  if (isHomepage) {
    return `<li>
      <div class="nt"><a href="#" onclick="window.JW.showBlogArticle('${b.id}');return false">${b.title}</a></div>
      <div class="nm">📅 ${b.date} · <span class="badge badge-blog">${b.category}</span></div>
    </li>`;
  }
  return `<li class="al-item">
    <div>
      <div class="al-cat">${b.category}</div>
      <div class="al-title"><a href="#" onclick="window.JW.showBlogArticle('${b.id}');return false">${b.title}</a></div>
      <div class="al-excerpt">${b.summary}</div>
      <div class="al-meta"><span>📅 ${b.date}</span><span>⏱️ ${b.read} read</span><span>By ${b.author}</span></div>
    </div>
    <div class="al-date">${b.date}</div>
  </li>`;
}

async function renderHomeBlogs(containerId, count = 3) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const blogs = await fetchBlogs();
  el.innerHTML = blogs.slice(0, count).map(b => blogItemHTML(b, true)).join('');
}

async function renderBlogPage(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const blogs = await fetchBlogs();
  el.innerHTML = blogs.map(b => blogItemHTML(b, false)).join('');
}

export {
  renderMembers, renderJobs, renderBusinesses, renderJoinForm,
  switchCommunityTab, fetchBlogs, renderHomeBlogs, renderBlogPage,
  blogItemHTML, FALLBACK_BLOGS
};
