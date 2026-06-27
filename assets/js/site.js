// ─────────────────────────────────────────────────────────────
//  Site behaviour. The old single-file admin panel and client-side
//  article store are gone: in Jekyll you add a Markdown file to
//  _posts/ and push. Everything below is the front-end glue.
// ─────────────────────────────────────────────────────────────

// ── MOBILE MENU ──
function toggleMenu() {
  var m = document.getElementById('mobileMenu');
  if (m) m.classList.toggle('open');
}

// ── ABOUT: expand / collapse ──
function toggleAbout() {
  
  const content = document.getElementById('about-content');
  if (!content) return;
  const arrows = document.querySelectorAll('.about-card-arrow');
  if (content.style.display === 'none' || content.style.display === '') {
    const yOffset = -80; 
    content.style.display = 'block';
    arrows.forEach(function (a) { a.style.display = 'none'; });
    // content.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const y = content.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({top: y, behavior: 'smooth'});
  } else {
    const yOffset = -10; 
    content.style.display = 'none';
    arrows.forEach(function (a) { a.style.display = 'block'; });
    const about = document.getElementById('about');
    if (about) {
      const y = about.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({top: y, behavior: 'smooth'});
    }
  }
}

// If a nav "About" link is clicked, expand the section too.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('a[href$="#about"]').forEach(function (link) {
    link.addEventListener('click', function () {
      var content = document.getElementById('about-content');
      if (content && content.style.display !== 'block') toggleAbout();
    });
  });
});

// ── IMAGE LIGHTBOX (used by figures in article bodies) ──
function openLightbox(id) {
  var img = document.getElementById(id);
  if (!img) return;
  var lb = document.getElementById('lightboxOverlay');
  if (!lb) {
    lb = document.createElement('div');
    lb.id = 'lightboxOverlay';
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;cursor:zoom-out;';
    lb.onclick = function () { lb.style.display = 'none'; document.body.style.overflow = ''; };
    var lbImg = document.createElement('img');
    lbImg.id = 'lightboxImg';
    lbImg.style.cssText = 'max-width:100%;max-height:90vh;border-radius:4px;box-shadow:0 8px 40px rgba(0,0,0,0.6);';
    lb.appendChild(lbImg);
    document.body.appendChild(lb);
  }
  document.getElementById('lightboxImg').src = img.src;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ── COPY ARTICLE LINK ──
function copyArticleLink() {
  navigator.clipboard.writeText(window.location.href).then(function () {
    var btn = document.getElementById('copyLinkBtn');
    if (!btn) return;
    btn.style.background = 'var(--green-700, #2d6a4f)';
    btn.style.color = '#fff';
    btn.style.position = 'relative';
    var notice = document.createElement('span');
    notice.textContent = 'Link copied!';
    notice.style.cssText = 'position:absolute; bottom:2.5rem; left:50%; transform:translateX(-50%); background:#fff; color:var(--green-700, #2d6a4f); border:1px solid var(--green-700, #2d6a4f); padding:0.35rem 0.85rem; border-radius:4px; font-size:0.85rem; white-space:nowrap; pointer-events:none;';
    btn.appendChild(notice);
    setTimeout(function () {
      btn.style.background = '';
      btn.style.color = '';
      btn.style.position = '';
      if (notice.parentNode) btn.removeChild(notice);
    }, 2000);
  });
}

// ── COOKIE CONSENT / GA4 ──
function updateToggleUI(granted) {
  var knob = document.getElementById('ga-toggle-knob');
  var btn = document.getElementById('ga-toggle');
  var status = document.getElementById('toggle-status');
  if (!knob || !btn || !status) return;
  if (granted) {
    knob.style.transform = 'translateX(22px)';
    btn.style.background = 'var(--green-500)';
    status.textContent = 'Currently: on';
  } else {
    knob.style.transform = 'translateX(0)';
    btn.style.background = 'var(--green-700)';
    status.textContent = 'Currently: off';
  }
}

function toggleGA() {
  var current = localStorage.getItem('ga_consent');
  if (current === 'granted') {
    localStorage.setItem('ga_consent', 'denied');
    updateToggleUI(false);
  } else {
    localStorage.setItem('ga_consent', 'granted');
    updateToggleUI(true);
    if (typeof window.loadGA === 'function' && !window.gaLoaded) {
      window.loadGA();
      window.gaLoaded = true;
    }
  }
}

function openPrivacyModal() {
  var modal = document.getElementById('privacy-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  updateToggleUI(localStorage.getItem('ga_consent') === 'granted');
}

function closePrivacyModal() {
  var modal = document.getElementById('privacy-modal');
  if (modal) modal.style.display = 'none';
}

(function () {
  var modal = document.getElementById('privacy-modal');
  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === this) closePrivacyModal(); });
  }
  var banner = document.getElementById('consent-banner');
  if (!banner) return; // GA4 disabled — no banner rendered
  var stored = localStorage.getItem('ga_consent');
  if (!stored) banner.style.display = 'block';
  if (stored === 'granted' && typeof window.loadGA === 'function') {
    window.loadGA();
    window.gaLoaded = true;
  }
  var accept = document.getElementById('consent-accept');
  var decline = document.getElementById('consent-decline');
  if (accept) accept.addEventListener('click', function () {
    localStorage.setItem('ga_consent', 'granted');
    banner.style.display = 'none';
    if (typeof window.loadGA === 'function') { window.loadGA(); window.gaLoaded = true; }
  });
  if (decline) decline.addEventListener('click', function () {
    localStorage.setItem('ga_consent', 'denied');
    banner.style.display = 'none';
  });
})();
