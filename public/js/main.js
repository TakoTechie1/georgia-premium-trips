/* ═══════════════════════════════════════════════════════════════
   GEORGIA PREMIUM TRIPS — Main JS
   ═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── SOUND ENGINE ────────────────────────────────────────────────────────────
const Sound = {
  ctx: null, enabled: false,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
  },
  play(freq, type = 'sine', dur = 0.08, vol = 0.06) {
    if (!this.enabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = type; osc.frequency.value = freq;
      const t = this.ctx.currentTime;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur);
    } catch(e) {}
  },
  click()   { this.play(600, 'sine', 0.06, 0.05); },
  hover()   { this.play(440, 'sine', 0.04, 0.02); },
  success() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.play(f,'sine',0.2,0.08), i*100)); },
  error()   { this.play(200, 'sawtooth', 0.15, 0.08); },
  open()    { this.play(660, 'sine', 0.1, 0.07); },
  close()   { this.play(440, 'sine', 0.1, 0.05); },
  toggle() {
    this.init();
    this.enabled = !this.enabled;
    const btn = document.getElementById('sound-toggle');
    const icon = document.getElementById('sound-icon');
    if (btn && icon) {
      btn.classList.toggle('active', this.enabled);
      icon.className = this.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    }
    if (this.enabled) this.success();
  }
};

// ─── CURSOR ───────────────────────────────────────────────────────────────────
const Cursor = {
  ring: null, dot: null, x: 0, y: 0, rx: 0, ry: 0,
  init() {
    this.ring = document.getElementById('cursor-ring');
    this.dot  = document.getElementById('cursor-dot');
    if (!this.ring) return;
    document.addEventListener('mousemove', e => {
      this.x = e.clientX; this.y = e.clientY;
      this.dot.style.left = e.clientX + 'px'; this.dot.style.top = e.clientY + 'px';
    });
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-click'));
    document.querySelectorAll('a,button,.btn,.tour-card,.dest-card,.gallery-item,.filter-btn,.gal-filter,.suggestion-chip,.indicator').forEach(el => {
      el.addEventListener('mouseenter', () => { document.body.classList.add('cursor-hover'); Sound.hover(); });
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
    this.animate();
  },
  animate() {
    this.rx += (this.x - this.rx) * 0.12;
    this.ry += (this.y - this.ry) * 0.12;
    if (this.ring) { this.ring.style.left = this.rx + 'px'; this.ring.style.top = this.ry + 'px'; }
    requestAnimationFrame(() => this.animate());
  }
};

// ─── LOADER ───────────────────────────────────────────────────────────────────
function hideLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('hide');
    document.body.classList.remove('loading');
    setTimeout(() => loader.remove(), 600);
  }, 1800);
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
function initNavbar() {
  const nav = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!nav) return;

  const onScroll = () => { nav.classList.toggle('scrolled', window.scrollY > 60); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  hamburger?.addEventListener('click', () => {
    Sound.click();
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('open');
  });
  document.querySelectorAll('.mob-link, .mob-cta').forEach(link => {
    link.addEventListener('click', () => {
      hamburger?.classList.remove('active');
      mobileMenu?.classList.remove('open');
    });
  });
  // Smooth scroll for all anchor links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); Sound.click(); }
    });
  });
}

// ─── HERO SLIDESHOW ───────────────────────────────────────────────────────────
const captions = [
  'გერგეთის სამება, ყაზბეგი 2170მ',
  'სვანეთის კოშკები, UNESCO ძეგლი',
  'კავკასიონის მწვერვალები',
  'კახეთი — ღვინის სამეფო'
];
function initHeroSlider() {
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.indicator');
  const caption = document.getElementById('hero-caption');
  if (!slides.length) return;
  let cur = 0;
  function go(n) {
    slides[cur].classList.remove('active');
    indicators[cur]?.classList.remove('active');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('active');
    indicators[cur]?.classList.add('active');
    if (caption) caption.textContent = captions[cur] || '';
  }
  indicators.forEach((ind, i) => ind.addEventListener('click', () => { go(i); Sound.click(); }));
  setInterval(() => go(cur + 1), 6000);
}

// ─── TYPEWRITER ───────────────────────────────────────────────────────────────
function initTypewriter() {
  const el = document.getElementById('hero-typewriter');
  if (!el) return;
  const texts = [
    'კავკასიონის მთები...',
    'უძველესი ღვინის კულტურა...',
    'UNESCO მსოფლიო მემკვიდრეობა...',
    'ქართული სტუმარმასპინძლობა...',
    'ბუნება, ისტორია, ემოცია...'
  ];
  let ti = 0, ci = 0, del = false;
  function tick() {
    const txt = texts[ti];
    el.textContent = del ? txt.slice(0, ci--) : txt.slice(0, ci++);
    if (!del && ci > txt.length) { del = true; setTimeout(tick, 1800); return; }
    if (del && ci < 0) { del = false; ti = (ti + 1) % texts.length; ci = 0; }
    setTimeout(tick, del ? 40 : 80);
  }
  tick();
}

// ─── PARTICLES ────────────────────────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.5;
      this.vx = (Math.random() - 0.5) * 0.2; this.vy = -Math.random() * 0.3 - 0.1;
      this.alpha = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.y < -10) this.reset();
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,76,${this.alpha})`; ctx.fill();
    }
  }
  for (let i = 0; i < 80; i++) particles.push(new Particle());
  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

// ─── COUNTER ANIMATION ────────────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const isDecimal = !Number.isInteger(target);
  const dur = 2000; const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 4);
    el.textContent = isDecimal ? (target * ease).toFixed(1) : Math.round(target * ease);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = '1';
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(el => obs.observe(el));
}

// ─── LOAD SETTINGS ────────────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const s = await res.json();
    if (s.announcement) {
      const bar = document.getElementById('announcement-bar');
      const txt = document.getElementById('announcement-text');
      if (bar && txt) { txt.textContent = s.announcement; bar.style.display = 'flex'; }
    }
    document.title = s.site_title || 'Georgia Premium Trips';
    // Update contact info
    document.querySelectorAll('.nav-phone').forEach(el => {
      if (s.phone) el.textContent = s.phone;
    });
  } catch(e) {}
}

// ─── LOAD TOURS ───────────────────────────────────────────────────────────────
let allTours = [];
let toursSwiper;

async function loadTours() {
  try {
    const res = await fetch('/api/tours');
    allTours = await res.json();
    renderTours(allTours);
    populateBookingSelect(allTours);
  } catch(e) { console.error('Tours load error:', e); }
}

function renderTours(tours) {
  const wrapper = document.getElementById('tours-wrapper');
  if (!wrapper) return;
  wrapper.innerHTML = tours.map(t => `
    <div class="swiper-slide">
      <div class="tour-card" data-id="${t.id}">
        <div class="tour-img-wrap">
          <img src="${t.image}" alt="${t.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'" />
          ${t.featured ? '<span class="tour-badge badge-featured">⭐ Featured</span>' : `<span class="tour-badge badge-${t.category}">${getCategoryLabel(t.category)}</span>`}
          ${t.original_price > t.price ? `<span class="tour-discount">-${Math.round((1-t.price/t.original_price)*100)}%</span>` : ''}
        </div>
        <div class="tour-body">
          <div class="tour-meta">
            <span class="tour-meta-item"><i class="fa-solid fa-clock"></i> ${t.duration}</span>
            <span class="tour-meta-item"><i class="fa-solid fa-users"></i> Max ${t.max_group}</span>
            <span class="tour-meta-item"><i class="fa-solid fa-gauge-simple"></i> ${t.difficulty}</span>
          </div>
          <h3>${t.name}</h3>
          <p>${t.short_description || t.description?.slice(0, 100) + '...'}</p>
          <div class="tour-highlights">
            ${(t.highlights||'').split(',').slice(0,3).map(h => `<span class="tour-highlight-tag">${h.trim()}</span>`).join('')}
          </div>
          <div class="tour-footer">
            <div class="tour-price">
              ${t.original_price > t.price ? `<span class="price-original">$${t.original_price}</span>` : ''}
              <span class="price-current">$${t.price}</span>
              <span class="price-unit">ერთი ადამიანი</span>
            </div>
            <button class="tour-book-btn" onclick="openTourModal(${t.id}); Sound.click()">
              <i class="fa-solid fa-eye"></i> დეტალები
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Re-init swiper
  if (toursSwiper) { toursSwiper.destroy(true, true); }
  toursSwiper = new Swiper('.tours-swiper', {
    slidesPerView: 1, spaceBetween: 24, grabCursor: true,
    pagination: { el: '.tours-pagination', clickable: true },
    navigation: { nextEl: '.tours-next', prevEl: '.tours-prev' },
    autoplay: { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
    breakpoints: {
      600: { slidesPerView: 2 },
      900: { slidesPerView: 3 },
      1200: { slidesPerView: 3 }
    }
  });

  // Hover sound for cards
  document.querySelectorAll('.tour-card').forEach(card => {
    card.addEventListener('mouseenter', () => Sound.hover());
    card.addEventListener('click', () => Sound.click());
  });
}

function getCategoryLabel(cat) {
  const map = { city:'ქალაქი', adventure:'მთა', cultural:'კულტურა', beach:'ზღვა', premium:'VIP' };
  return map[cat] || cat;
}

// Tour filters
function initTourFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Sound.click();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const filtered = filter === 'all' ? allTours : allTours.filter(t => t.category === filter);
      renderTours(filtered);
    });
  });
}

// Tour Modal
function openTourModal(id) {
  const tour = allTours.find(t => t.id === id);
  if (!tour) return;
  Sound.open();
  const modal = document.getElementById('tour-modal');
  const content = document.getElementById('modal-content');
  const discount = tour.original_price > tour.price ? Math.round((1-tour.price/tour.original_price)*100) : 0;
  content.innerHTML = `
    <img class="modal-tour-img" src="${tour.image}" alt="${tour.name}" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80'" />
    <div class="modal-body">
      <h2>${tour.name}</h2>
      <div class="modal-meta">
        <span class="modal-meta-item"><i class="fa-solid fa-clock"></i> ${tour.duration}</span>
        <span class="modal-meta-item"><i class="fa-solid fa-users"></i> Max ${tour.max_group}</span>
        <span class="modal-meta-item"><i class="fa-solid fa-gauge-simple"></i> ${tour.difficulty}</span>
        ${discount ? `<span class="modal-meta-item" style="color:var(--wine-light)"><i class="fa-solid fa-tag"></i> -${discount}% OFF</span>` : ''}
      </div>
      <p class="modal-desc">${tour.description}</p>
      <div class="modal-included">
        <h4><i class="fa-solid fa-check-circle"></i> ჩართულია</h4>
        <div class="modal-tags">
          ${(tour.included||'').split(',').map(i => `<span class="modal-tag">✓ ${i.trim()}</span>`).join('')}
        </div>
      </div>
      <div class="modal-highlights">
        <h4><i class="fa-solid fa-map-pin"></i> ძირითადი ადგილები</h4>
        <div class="modal-tags">
          ${(tour.highlights||'').split(',').map(h => `<span class="modal-tag">📍 ${h.trim()}</span>`).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <div class="tour-price">
          ${tour.original_price > tour.price ? `<span class="price-original">$${tour.original_price}</span>` : ''}
          <span class="price-current">$${tour.price}</span>
          <span class="price-unit">/ ადამიანი</span>
        </div>
        <button class="btn btn-gold" onclick="scrollToBooking(${tour.id}); closeModal()">
          <i class="fa-solid fa-calendar-check"></i> დაჯავშნე
        </button>
      </div>
    </div>
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  Sound.close();
  const modal = document.getElementById('tour-modal');
  modal?.classList.remove('open');
  document.body.style.overflow = '';
}

function scrollToBooking(tourId) {
  const bookingSection = document.getElementById('booking');
  bookingSection?.scrollIntoView({ behavior: 'smooth' });
  if (tourId) {
    setTimeout(() => {
      const sel = document.getElementById('booking-tour');
      if (sel) { sel.value = tourId; sel.dispatchEvent(new Event('change')); }
    }, 600);
  }
}
window.openTourModal = openTourModal;
window.scrollToBooking = scrollToBooking;

// ─── LOAD TESTIMONIALS ────────────────────────────────────────────────────────
let testimonialsSwiper;
async function loadTestimonials() {
  try {
    const res = await fetch('/api/testimonials');
    const tests = await res.json();
    const wrapper = document.getElementById('testimonials-wrapper');
    if (!wrapper || !tests.length) return;
    wrapper.innerHTML = tests.map(t => `
      <div class="swiper-slide">
        <div class="testimonial-card">
          <div class="test-stars">${'★'.repeat(t.rating)}</div>
          <p class="test-text">${t.text}</p>
          <div class="test-author">
            <div class="test-avatar">${t.name.charAt(0)}</div>
            <div>
              <div class="test-name">${t.flag||''} ${t.name}</div>
              <div class="test-country">${t.country}</div>
            </div>
          </div>
          ${t.tour_name ? `<div class="test-tour"><span>ტური: ${t.tour_name}</span></div>` : ''}
        </div>
      </div>
    `).join('');
    if (testimonialsSwiper) testimonialsSwiper.destroy(true, true);
    testimonialsSwiper = new Swiper('.testimonials-swiper', {
      slidesPerView: 1, spaceBetween: 24, grabCursor: true,
      pagination: { el: '.testimonials-pagination', clickable: true },
      autoplay: { delay: 5500, disableOnInteraction: false, pauseOnMouseEnter: true },
      breakpoints: { 600: { slidesPerView: 2 }, 900: { slidesPerView: 3 } }
    });
  } catch(e) {}
}

// ─── GALLERY ──────────────────────────────────────────────────────────────────
let galleryItems = [];
let lightboxIdx = 0;

async function loadGallery(category = 'all') {
  try {
    const url = category === 'all' ? '/api/gallery' : `/api/gallery?category=${category}`;
    const res = await fetch(url);
    galleryItems = await res.json();
    renderGallery(galleryItems);
  } catch(e) {}
}

function renderGallery(items) {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = items.map((item, i) => `
    <div class="gallery-item" data-idx="${i}" onclick="openLightbox(${i})">
      <img src="${item.image}" alt="${item.title||''}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'" />
      <div class="gallery-item-overlay"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
    </div>
  `).join('');
}

function openLightbox(idx) {
  Sound.open();
  lightboxIdx = idx;
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
  updateLightbox();
}

function updateLightbox() {
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  const item = galleryItems[lightboxIdx];
  if (img && item) { img.src = item.image; img.alt = item.title || ''; }
  if (cap && item) cap.textContent = item.title || '';
}

function closeLightbox() {
  Sound.close();
  document.getElementById('lightbox')?.classList.remove('open');
  document.body.style.overflow = '';
}

function initGallery() {
  document.querySelectorAll('.gal-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      Sound.click();
      document.querySelectorAll('.gal-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadGallery(btn.dataset.cat);
    });
  });
  document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev')?.addEventListener('click', () => {
    Sound.click(); lightboxIdx = (lightboxIdx - 1 + galleryItems.length) % galleryItems.length; updateLightbox();
  });
  document.getElementById('lightbox-next')?.addEventListener('click', () => {
    Sound.click(); lightboxIdx = (lightboxIdx + 1) % galleryItems.length; updateLightbox();
  });
  document.getElementById('lightbox')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox')?.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') { lightboxIdx = (lightboxIdx-1+galleryItems.length)%galleryItems.length; updateLightbox(); }
    if (e.key === 'ArrowRight') { lightboxIdx = (lightboxIdx+1)%galleryItems.length; updateLightbox(); }
  });
}

// ─── BOOKING FORM ─────────────────────────────────────────────────────────────
function populateBookingSelect(tours) {
  const sel = document.getElementById('booking-tour');
  if (!sel) return;
  tours.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id; opt.textContent = `${t.name} — $${t.price}`;
    sel.appendChild(opt);
  });
}

function initBookingForm() {
  // Step navigation
  document.querySelectorAll('.next-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const from = parseInt(btn.closest('.form-step').id.replace('step-', ''));
      const to = parseInt(btn.dataset.to);
      if (!validateStep(from)) return;
      Sound.click();
      document.getElementById(`step-${from}`)?.classList.remove('active');
      document.getElementById(`step-${to}`)?.classList.add('active');
      updateStepIndicators(to);
      updatePricePreview();
    });
  });
  document.querySelectorAll('.prev-step').forEach(btn => {
    btn.addEventListener('click', () => {
      Sound.click();
      const from = parseInt(btn.closest('.form-step').id.replace('step-', ''));
      const to = parseInt(btn.dataset.to);
      document.getElementById(`step-${from}`)?.classList.remove('active');
      document.getElementById(`step-${to}`)?.classList.add('active');
      updateStepIndicators(to);
    });
  });

  // Guest counter
  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Sound.click();
      const input = btn.parentElement.querySelector('input');
      let v = parseInt(input.value) || 1;
      if (btn.dataset.action === 'plus') v = Math.min(v + 1, 20);
      if (btn.dataset.action === 'minus') v = Math.max(v - 1, 1);
      input.value = v;
      updatePricePreview();
    });
  });

  // Set min date to today
  const dateInput = document.querySelector('input[name="date"]');
  if (dateInput) { const today = new Date().toISOString().split('T')[0]; dateInput.min = today; }

  // Tour preview
  const tourSel = document.getElementById('booking-tour');
  if (tourSel) {
    tourSel.addEventListener('change', () => {
      const tour = allTours.find(t => t.id == tourSel.value);
      const preview = document.getElementById('tour-preview');
      if (tour && preview) {
        preview.style.display = 'block';
        preview.innerHTML = `<h4>${tour.name}</h4><p>${tour.duration} • $${tour.price}/pers</p>`;
      } else if (preview) preview.style.display = 'none';
      updatePricePreview();
    });
  }

  // Submit
  document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    Sound.click();
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> იგზავნება...';
    const data = Object.fromEntries(new FormData(e.target));
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        Sound.success();
        document.getElementById('step-3')?.classList.remove('active');
        const suc = document.getElementById('step-success');
        suc.style.display = 'block';
        document.getElementById('booking-success-msg').textContent = result.message;
        document.getElementById('booking-ref').textContent = result.booking_ref;
        updateStepIndicators(4);
        showToast('დაჯავშნა წარმატებით გაიგზავნა! ✅', 'success');
      } else { Sound.error(); showToast(result.error || 'შეცდომა', 'error'); }
    } catch(err) { Sound.error(); showToast('კავშირის შეცდომა', 'error'); }
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> განაცხადის გაგზავნა';
  });
}

function updatePricePreview() {
  const preview = document.getElementById('form-price-preview');
  if (!preview) return;
  const tourId = document.getElementById('booking-tour')?.value;
  const guests = parseInt(document.querySelector('input[name="guests"]')?.value) || 1;
  const tour = allTours.find(t => t.id == tourId);
  if (tour) {
    preview.style.display = 'flex';
    preview.innerHTML = `
      <span class="price-label">${guests} ადამიანი × $${tour.price}</span>
      <span class="price-total">$${tour.price * guests}</span>
    `;
  } else preview.style.display = 'none';
}

function validateStep(step) {
  if (step === 1) {
    const tourId = document.getElementById('booking-tour')?.value;
    if (!tourId) { showToast('გთხოვთ ირჩიოთ ტური', 'error'); Sound.error(); return false; }
  }
  if (step === 2) {
    const name = document.querySelector('input[name="name"]')?.value?.trim();
    const email = document.querySelector('input[name="email"]')?.value?.trim();
    if (!name || !email) { showToast('შეავსეთ სავალდებულო ველები', 'error'); Sound.error(); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('ელ-ფოსტა არასწორია', 'error'); Sound.error(); return false; }
  }
  return true;
}

function updateStepIndicators(active) {
  document.querySelectorAll('.step').forEach((s, i) => {
    const n = i + 1;
    s.classList.remove('active', 'done');
    if (n < active) s.classList.add('done');
    else if (n === active) s.classList.add('active');
  });
}

function resetBookingForm() {
  document.getElementById('step-success').style.display = 'none';
  document.getElementById('step-1').classList.add('active');
  document.getElementById('booking-form').reset();
  document.getElementById('tour-preview').style.display = 'none';
  updateStepIndicators(1);
}
window.resetBookingForm = resetBookingForm;

// ─── CONTACT FORM ─────────────────────────────────────────────────────────────
function initContactForm() {
  document.getElementById('contact-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    Sound.click();
    const btn = e.target.querySelector('[type="submit"]');
    btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> იგზავნება...';
    const data = Object.fromEntries(new FormData(e.target));
    const result_el = document.getElementById('contact-result');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success) {
        Sound.success();
        result_el.textContent = '✅ ' + result.message;
        result_el.className = 'success'; result_el.style.display = 'block';
        e.target.reset();
        showToast('შეტყობინება გაიგზავნა! ✅', 'success');
      } else {
        result_el.textContent = '❌ ' + (result.error || 'შეცდომა');
        result_el.className = 'error'; result_el.style.display = 'block';
        Sound.error();
      }
    } catch(err) {
      result_el.textContent = '❌ კავშირის შეცდომა'; result_el.className = 'error'; result_el.style.display = 'block';
      Sound.error();
    }
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> შეტყობინების გაგზავნა';
  });
}

// ─── BACK TO TOP ──────────────────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => { Sound.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

// ─── MODAL CLOSE ─────────────────────────────────────────────────────────────
function initModalClose() {
  document.getElementById('modal-close')?.addEventListener('click', closeModal);
  document.getElementById('tour-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeLightbox(); }
  });
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}
window.showToast = showToast;

// ─── SOUND TOGGLE ─────────────────────────────────────────────────────────────
function initSoundToggle() {
  document.getElementById('sound-toggle')?.addEventListener('click', () => Sound.toggle());
}

// ─── HOVER SOUND FOR ALL BTNS ──────────────────────────────────────────────────
function addHoverSounds() {
  document.querySelectorAll('.btn, button').forEach(el => {
    el.addEventListener('mouseenter', () => Sound.hover());
    el.addEventListener('click', () => Sound.click());
  });
}

// ─── AOS INIT ──────────────────────────────────────────────────────────────────
function initAOS() {
  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
  }
}

// ─── INIT ALL ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.body.classList.add('loading');
  initAOS();
  Cursor.init();
  initSoundToggle();
  initNavbar();
  initHeroSlider();
  initTypewriter();
  initParticles();
  initCounters();
  initModalClose();
  initGallery();
  initBackToTop();
  addHoverSounds();

  await Promise.all([loadSettings(), loadTours(), loadTestimonials(), loadGallery()]);

  initTourFilters();
  initBookingForm();
  initContactForm();

  hideLoader();
});
