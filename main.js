/* ========================================
   Excel Espresso — main.js
   Client-side rendering + interactions
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initFAQ();
  initScrollHeader();
  initTemplates();
  initBlog();
  initScrollAnimations();
  initContactForm();
  initEmailCapture();
});

/* --- Navigation --- */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const overlay = document.querySelector('.nav-overlay');

  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      links.classList.remove('open');
      overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  // Close on link click (mobile)
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* --- Scroll-triggered animations --- */
let _scrollObserver = null;

function initScrollAnimations() {
  // If user prefers reduced motion, mark all visible immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  _scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      // Stagger siblings in the same parent
      const siblings = Array.from(el.parentElement.querySelectorAll('.animate-in:not(.visible)'));
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = `${idx * 0.08}s`;
      el.classList.add('visible');
      _scrollObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

  document.querySelectorAll('.animate-in').forEach(el => _scrollObserver.observe(el));
}

function observeAnimations(container) {
  if (!_scrollObserver) return;
  (container || document).querySelectorAll('.animate-in').forEach(el => _scrollObserver.observe(el));
}

/* --- Scroll header shadow --- */
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

/* --- FAQ Accordion --- */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(btn => {
    if (!btn.hasAttribute('aria-expanded')) {
      btn.setAttribute('aria-expanded', 'false');
    }
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');

      // Close siblings (and reset their aria-expanded)
      item.parentElement.querySelectorAll('.faq-item.open').forEach(el => {
        el.classList.remove('open');
        const q = el.querySelector('.faq-question');
        if (q) q.setAttribute('aria-expanded', 'false');
      });

      if (!wasOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* Resolve path to /data/ regardless of which subdirectory the page is in */
function dataPath(filename) {
  return window.location.pathname.includes('/pages/') ? `../data/${filename}` : `data/${filename}`;
}

/* --- Templates Rendering --- */
async function initTemplates() {
  const grid = document.getElementById('templates-grid');
  if (!grid) return;

  try {
    let templates;
    if (window._templatesData) {
      templates = window._templatesData;
    } else {
      const res = await fetch(dataPath('templates.json'));
      templates = await res.json();
    }
    window._allTemplates = templates;
    renderTemplates(templates);
    observeAnimations(grid);
    initFilters(templates);
  } catch (e) {
    grid.innerHTML = '<div class="no-results"><div class="icon">📂</div><p>ไม่สามารถโหลดข้อมูลเทมเพลตได้</p></div>';
  }
}

function renderTemplates(templates) {
  const grid = document.getElementById('templates-grid');
  if (!grid) return;

  if (templates.length === 0) {
    grid.innerHTML = '<div class="no-results"><div class="icon">🔍</div><p>ไม่พบเทมเพลตที่ตรงกัน ลองเปลี่ยนตัวกรอง</p></div>';
    return;
  }

  grid.innerHTML = templates.map(t => templateCardHTML(t)).join('');
}

function templateCardHTML(t) {
  const levelClass = t.level === 'ง่าย' ? 'level-easy' : t.level === 'กลาง' ? 'level-medium' : 'level-hard';
  return `
    <article class="template-card animate-in">
      <div class="card-preview">
        ${t.image ? `<img src="${t.image}" alt="${t.name}" loading="lazy">` : `
        <div class="preview-placeholder">
          <span class="icon">📊</span>
          <span>ตัวอย่างหน้าจอ</span>
        </div>`}
        <span class="card-badge ${levelClass}">${t.level}</span>
      </div>
      <div class="card-body">
        <span class="card-category">${t.category}</span>
        <h3>${t.name}</h3>
        <p>${t.description}</p>
        <div class="card-meta">
          <span>📁 ${t.format}</span>
          <span>🏷️ ${t.version}</span>
          <span>👤 ${t.audience}</span>
        </div>
        <div class="card-actions">
          <a href="${t.slug}" class="btn btn-secondary btn-sm">ดูรายละเอียด</a>
          <a href="${t.download}" class="btn btn-primary btn-sm" download>ดาวน์โหลด</a>
        </div>
      </div>
    </article>`;
}

function initFilters(allTemplates) {
  const searchInput = document.getElementById('template-search');
  const catFilter = document.getElementById('filter-category');
  const lvlFilter = document.getElementById('filter-level');

  function applyFilters() {
    let filtered = [...allTemplates];
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const cat = catFilter ? catFilter.value : '';
    const lvl = lvlFilter ? lvlFilter.value : '';

    if (q) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
    }
    if (cat) filtered = filtered.filter(t => t.category === cat);
    if (lvl) filtered = filtered.filter(t => t.level === lvl);

    renderTemplates(filtered);
    observeAnimations(document.getElementById('templates-grid'));
  }

  [searchInput, catFilter, lvlFilter].forEach(el => {
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });
}

/* --- Blog Rendering --- */
async function initBlog() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  try {
    let posts;
    if (window._postsData) {
      posts = window._postsData;
    } else {
      const res = await fetch(dataPath('posts.json'));
      posts = await res.json();
    }
    window._allPosts = posts;
    renderBlog(posts);
    observeAnimations(grid);
    initBlogFilters(posts);
  } catch (e) {
    grid.innerHTML = '<div class="no-results"><div class="icon">📝</div><p>ไม่สามารถโหลดข้อมูลบทความได้</p></div>';
  }
}

function renderBlog(posts) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  if (posts.length === 0) {
    grid.innerHTML = '<div class="no-results"><div class="icon">🔍</div><p>ไม่พบบทความที่ตรงกัน</p></div>';
    return;
  }

  grid.innerHTML = posts.map(p => blogCardHTML(p)).join('');
}

function blogCardHTML(p) {
  return `
    <article class="blog-card animate-in">
      <div class="card-image">
        ${p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy">` : `
        <div class="image-placeholder">
          <span class="icon">📝</span>
          <span>ภาพบทความ</span>
        </div>`}
      </div>
      <div class="card-body">
        <span class="card-category">${p.category}</span>
        <h3><a href="${p.slug}">${p.title}</a></h3>
        <p>${p.excerpt}</p>
        <div class="card-footer">
          <span>${p.date}</span>
          <span>⏱ ${p.readTime}</span>
        </div>
      </div>
    </article>`;
}

function initBlogFilters(allPosts) {
  const searchInput = document.getElementById('blog-search');
  const catFilter = document.getElementById('blog-filter-category');

  function applyFilters() {
    let filtered = [...allPosts];
    const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const cat = catFilter ? catFilter.value : '';

    if (q) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
      );
    }
    if (cat) filtered = filtered.filter(p => p.category === cat);

    renderBlog(filtered);
  }

  [searchInput, catFilter].forEach(el => {
    if (el) {
      el.addEventListener('input', applyFilters);
      el.addEventListener('change', applyFilters);
    }
  });
}

/* --- Contact Form (static, mailto fallback) --- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]')?.value || '';
    const email = form.querySelector('[name="email"]')?.value || '';
    const message = form.querySelector('[name="message"]')?.value || '';
    const subject = encodeURIComponent(`ติดต่อจากเว็บไซต์ — ${name}`);
    const body = encodeURIComponent(`ชื่อ: ${name}\nอีเมล: ${email}\n\nข้อความ:\n${message}`);
    window.location.href = `mailto:hello@excelespresso.com?subject=${subject}&body=${body}`;
  });

  const reqForm = document.getElementById('request-form');
  if (!reqForm) return;

  reqForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const template = reqForm.querySelector('[name="template-request"]')?.value || '';
    const use = reqForm.querySelector('[name="use"]')?.value || '';
    const subject = encodeURIComponent('ขอเทมเพลตใหม่');
    const body = encodeURIComponent(`เทมเพลตที่อยากได้:\n${template}${use ? `\n\nใช้ทำอะไร:\n${use}` : ''}`);
    window.location.href = `mailto:hello@excelespresso.com?subject=${subject}&body=${body}`;
  });
}

/* --- Email Capture (mailto fallback) --- */
function initEmailCapture() {
  const form = document.getElementById('email-capture-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]')?.value || '';
    const subject = encodeURIComponent('สมัครรับเทมเพลตใหม่');
    const body = encodeURIComponent(`อีเมล: ${email}\n\nฝากส่งเทมเพลตใหม่ให้ด้วยนะครับ/ค่ะ`);
    window.location.href = `mailto:hello@excelespresso.com?subject=${subject}&body=${body}`;
  });
}
