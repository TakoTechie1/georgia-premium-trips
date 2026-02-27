/* ═══════════════════════════════════════════════════════════════
   GEORGIA PREMIUM TRIPS — Admin Panel JS
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const Admin = {
  token: null,
  username: null,
  allBookings: [],
  allTours: [],

  // ── AUTH ─────────────────────────────────────────────────────────────────
  init() {
    this.token = localStorage.getItem('gp_admin_token');
    this.username = localStorage.getItem('gp_admin_user');
    if (this.token) this.showApp();
    else this.showLogin();
    this.bindEvents();
  },

  showLogin() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('admin-app').style.display = 'none';
  },

  showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('admin-app').style.display = 'flex';
    document.getElementById('admin-username').textContent = this.username || 'admin';
    this.loadStats();
  },

  bindEvents() {
    // Login form
    document.getElementById('login-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = document.getElementById('login-btn');
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> შესვლა...';
      btn.disabled = true;
      const fd = new FormData(e.target);
      try {
        const res = await this.api('/api/admin/login', 'POST', { username: fd.get('username'), password: fd.get('password') });
        this.token = res.token;
        this.username = res.username;
        localStorage.setItem('gp_admin_token', res.token);
        localStorage.setItem('gp_admin_user', res.username);
        this.showApp();
      } catch(err) {
        const errEl = document.getElementById('login-error');
        errEl.textContent = '❌ ' + (err.message || 'არასწორი სერთიფიკატები');
        errEl.style.display = 'block';
      }
      btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> შესვლა';
      btn.disabled = false;
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
    document.getElementById('sidebar-close')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });

    // Nav items
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        this.navigateTo(item.dataset.page);
        document.getElementById('sidebar').classList.remove('open');
      });
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      localStorage.removeItem('gp_admin_token');
      localStorage.removeItem('gp_admin_user');
      this.token = null;
      this.showLogin();
    });

    // Password toggle
    document.getElementById('pw-toggle')?.addEventListener('click', () => {
      const inp = document.getElementById('pw-input');
      const icon = document.querySelector('#pw-toggle i');
      if (inp.type === 'password') { inp.type = 'text'; icon.className = 'fa-solid fa-eye-slash'; }
      else { inp.type = 'password'; icon.className = 'fa-solid fa-eye'; }
    });

    // Tour form
    document.getElementById('tour-form')?.addEventListener('submit', e => this.saveTour(e));
    document.getElementById('add-tour-btn')?.addEventListener('click', () => this.openTourModal());

    // Testimonial form
    document.getElementById('test-form')?.addEventListener('submit', e => this.saveTestimonial(e));
    document.getElementById('add-test-btn')?.addEventListener('click', () => this.openTestModal());

    // Car form
    document.getElementById('car-form')?.addEventListener('submit', e => this.saveCar(e));
    document.getElementById('add-car-btn')?.addEventListener('click', () => this.openCarModal());

    // Car file pick
    document.getElementById('car-file-pick')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const b64 = await this.compressImage(file);
      document.getElementById('car-image-input').value = b64;
      document.getElementById('car-img-preview').innerHTML = `<img src="${b64}" />`;
    });

    // Car URL input preview
    document.getElementById('car-image-input')?.addEventListener('input', e => {
      const prev = document.getElementById('car-img-preview');
      if (!prev) return;
      const v = e.target.value;
      if (v && !v.startsWith('data:')) prev.innerHTML = `<img src="${v}" onerror="this.style.display='none'" />`;
      else if (!v) prev.innerHTML = '';
    });

    // Gallery form
    document.getElementById('gallery-form')?.addEventListener('submit', e => this.saveGallery(e));
    document.getElementById('add-photo-btn')?.addEventListener('click', () => this.openGalleryModal());

    // Gallery image URL preview (typed URL)
    document.querySelector('#gallery-form input[name="image"]')?.addEventListener('input', e => {
      const prev = document.getElementById('gallery-preview');
      const v = e.target.value;
      if (v && !v.startsWith('data:')) prev.innerHTML = `<img src="${v}" onerror="this.style.display='none'" />`;
      else if (!v) prev.innerHTML = '';
    });

    // Tour file pick
    document.getElementById('tour-file-pick')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const b64 = await this.compressImage(file);
      document.getElementById('tour-image-input').value = b64;
      document.getElementById('tour-img-preview').innerHTML = `<img src="${b64}" />`;
    });

    // Tour URL input preview (typed URL)
    document.getElementById('tour-image-input')?.addEventListener('input', e => {
      const prev = document.getElementById('tour-img-preview');
      if (!prev) return;
      const v = e.target.value;
      if (v && !v.startsWith('data:')) prev.innerHTML = `<img src="${v}" onerror="this.style.display='none'" />`;
      else if (!v) prev.innerHTML = '';
    });

    // Gallery file pick
    document.getElementById('gallery-file-pick')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const b64 = await this.compressImage(file);
      document.querySelector('#gallery-form input[name="image"]').value = b64;
      document.getElementById('gallery-preview').innerHTML = `<img src="${b64}" />`;
    });

    // Settings form
    document.getElementById('settings-form')?.addEventListener('submit', e => this.saveSettings(e));

    // Password form
    document.getElementById('password-form')?.addEventListener('submit', e => this.changePassword(e));

    // Close modals on background click
    document.querySelectorAll('.modal-bg').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
    });
  },

  navigateTo(page) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${page}`)?.classList.add('active');
    const titles = { dashboard:'Dashboard', tours:'ტურები', bookings:'ჯავშნები', messages:'შეტყობინებები', testimonials:'შეფასებები', cars:'მანქანები', gallery:'გალერეა', settings:'პარამეტრები' };
    document.getElementById('page-title').textContent = titles[page] || page;
    const loaders = { tours: () => this.loadTours(), bookings: () => this.loadBookings(), messages: () => this.loadMessages(), testimonials: () => this.loadTestimonials(), cars: () => this.loadCars(), gallery: () => this.loadGallery(), settings: () => this.loadSettings() };
    loaders[page]?.();
  },

  // ── API HELPER ────────────────────────────────────────────────────────────
  async api(url, method = 'GET', body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  toast(msg, type = 'i') {
    const t = document.getElementById('admin-toast');
    if (!t) return;
    t.textContent = msg; t.className = `admin-toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
  },

  confirm(msg) { return window.confirm(msg); },

  // ── STATS / DASHBOARD ─────────────────────────────────────────────────────
  async loadStats() {
    try {
      const s = await this.api('/api/admin/stats');
      document.getElementById('stat-tours').textContent = s.tours;
      document.getElementById('stat-bookings').textContent = s.bookings;
      document.getElementById('stat-pending').textContent = s.pending;
      document.getElementById('stat-revenue').textContent = '$' + (s.revenue || 0).toLocaleString();
      document.getElementById('stat-unread').textContent = s.unread;
      document.getElementById('stat-testimonials').textContent = s.testimonials;
      // Badges
      if (s.pending > 0) { const b = document.getElementById('bookings-badge'); b.textContent = s.pending; b.style.display='inline'; }
      if (s.unread > 0) { const b = document.getElementById('messages-badge'); b.textContent = s.unread; b.style.display='inline'; }
      document.getElementById('tours-badge').textContent = s.tours;
      // Recent bookings
      const rb = document.getElementById('recent-bookings');
      if (rb) rb.innerHTML = (s.recent_bookings || []).map(b => `
        <tr>
          <td>${b.name}</td>
          <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.tour_name||'—'}</td>
          <td><span class="badge badge-${b.status}">${b.status}</span></td>
          <td style="color:var(--muted);font-size:0.78rem">${b.created_at?.slice(0,10)||''}</td>
        </tr>
      `).join('');
      // Recent messages
      const rm = document.getElementById('recent-messages');
      if (rm) rm.innerHTML = (s.recent_messages || []).map(m => `
        <tr>
          <td>${m.name}</td>
          <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.subject||'—'}</td>
          <td><span class="badge badge-${m.status}">${m.status}</span></td>
        </tr>
      `).join('');
    } catch(e) { this.toast('Stats load error: ' + e.message, 'e'); }
  },

  // ── TOURS ─────────────────────────────────────────────────────────────────
  async loadTours() {
    try {
      this.allTours = await this.api('/api/admin/tours');
      const tbody = document.getElementById('tours-tbody');
      if (!tbody) return;
      tbody.innerHTML = this.allTours.map(t => `
        <tr>
          <td style="display:flex;align-items:center;gap:10px">
            <img class="tour-thumb" src="${t.image}" onerror="this.src=''" alt="" />
            <span>${t.name}</span>
          </td>
          <td>${t.category}</td>
          <td>${t.duration}</td>
          <td>$${t.price}${t.original_price > t.price ? ` <small style="color:var(--muted);text-decoration:line-through">$${t.original_price}</small>` : ''}</td>
          <td><span class="badge badge-${t.active ? 'active' : 'inactive'}">${t.active ? 'Active' : 'Inactive'}</span></td>
          <td><span class="badge ${t.featured ? 'badge-yes' : ''}">${t.featured ? '⭐ Yes' : 'No'}</span></td>
          <td>
            <div class="act-btns">
              <button class="act-btn edit" onclick="Admin.openTourModal(${t.id})"><i class="fa-solid fa-pen"></i></button>
              <button class="act-btn delete" onclick="Admin.deleteTour(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch(e) { this.toast('Tours load error', 'e'); }
  },

  openTourModal(id = null) {
    const form = document.getElementById('tour-form');
    form.reset();
    document.querySelector('#tour-form input[name="id"]').value = '';
    document.getElementById('tour-modal-title').textContent = id ? 'ტურის რედ.' : 'ახალი ტური';
    document.getElementById('tour-img-preview').innerHTML = '';
    const fp = document.getElementById('tour-file-pick'); if (fp) fp.value = '';
    if (id) {
      const t = this.allTours.find(x => x.id === id);
      if (t) {
        form.querySelector('[name="id"]').value = t.id;
        form.querySelector('[name="name"]').value = t.name || '';
        form.querySelector('[name="description"]').value = t.description || '';
        form.querySelector('[name="short_description"]').value = t.short_description || '';
        form.querySelector('[name="duration"]').value = t.duration || '';
        form.querySelector('[name="price"]').value = t.price || '';
        form.querySelector('[name="original_price"]').value = t.original_price || '';
        form.querySelector('[name="image"]').value = t.image || '';
        form.querySelector('[name="category"]').value = t.category || 'city';
        form.querySelector('[name="difficulty"]').value = t.difficulty || 'Easy';
        form.querySelector('[name="max_group"]').value = t.max_group || 12;
        form.querySelector('[name="included"]').value = t.included || '';
        form.querySelector('[name="highlights"]').value = t.highlights || '';
        form.querySelector('[name="active"]').value = t.active ? '1' : '0';
        form.querySelector('[name="featured"]').checked = !!t.featured;
        if (t.image) document.getElementById('tour-img-preview').innerHTML = `<img src="${t.image}" onerror="this.style.display='none'" />`;
      }
    }
    document.getElementById('tour-form-modal').classList.add('open');
  },

  closeTourModal() { document.getElementById('tour-form-modal').classList.remove('open'); },

  async saveTour(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.featured = fd.get('featured') === '1' ? 1 : 0;
    const id = data.id; delete data.id;
    try {
      if (id) await this.api(`/api/admin/tours/${id}`, 'PUT', data);
      else await this.api('/api/admin/tours', 'POST', data);
      this.closeTourModal();
      this.loadTours();
      this.toast(id ? '✅ ტური განახლდა' : '✅ ტური დაემატა', 's');
    } catch(err) { this.toast('❌ ' + err.message, 'e'); }
  },

  async deleteTour(id) {
    if (!this.confirm('წაშლა?')) return;
    try { await this.api(`/api/admin/tours/${id}`, 'DELETE'); this.loadTours(); this.toast('✅ ტური წაიშალა', 's'); }
    catch(e) { this.toast('❌ შეცდომა', 'e'); }
  },

  // ── BOOKINGS ──────────────────────────────────────────────────────────────
  async loadBookings() {
    try {
      this.allBookings = await this.api('/api/admin/bookings');
      this.renderBookings(this.allBookings);
    } catch(e) { this.toast('Bookings load error', 'e'); }
  },

  renderBookings(bookings) {
    const tbody = document.getElementById('bookings-tbody');
    if (!tbody) return;
    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td><code style="font-size:0.78rem;color:var(--gold)">${b.booking_ref}</code></td>
        <td>${b.name}<br><small style="color:var(--muted)">${b.email}</small></td>
        <td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.tour_name||'—'}</td>
        <td>${b.date||'—'}</td>
        <td>${b.guests}</td>
        <td>${b.total_price ? '$'+b.total_price : '—'}</td>
        <td><span class="badge badge-${b.status}">${b.status}</span></td>
        <td>
          <div class="act-btns">
            <button class="act-btn view" onclick="Admin.viewBooking(${b.id})"><i class="fa-solid fa-eye"></i></button>
            <button class="act-btn delete" onclick="Admin.deleteBooking(${b.id})"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  filterBookings() {
    const status = document.getElementById('booking-status-filter').value;
    const filtered = status ? this.allBookings.filter(b => b.status === status) : this.allBookings;
    this.renderBookings(filtered);
  },

  viewBooking(id) {
    const b = this.allBookings.find(x => x.id === id);
    if (!b) return;
    const body = document.getElementById('booking-detail-body');
    body.innerHTML = `
      <div class="detail-row"><span class="detail-label">სარეზ. კოდი</span><span class="detail-value" style="color:var(--gold);font-weight:700">${b.booking_ref}</span></div>
      <div class="detail-row"><span class="detail-label">სახელი</span><span class="detail-value">${b.name}</span></div>
      <div class="detail-row"><span class="detail-label">ელ-ფოსტა</span><span class="detail-value"><a href="mailto:${b.email}" style="color:var(--blue)">${b.email}</a></span></div>
      <div class="detail-row"><span class="detail-label">ტელეფონი</span><span class="detail-value">${b.phone||'—'}</span></div>
      <div class="detail-row"><span class="detail-label">ტური</span><span class="detail-value">${b.tour_name||'—'}</span></div>
      <div class="detail-row"><span class="detail-label">თარიღი</span><span class="detail-value">${b.date||'—'}</span></div>
      <div class="detail-row"><span class="detail-label">სტუმრები</span><span class="detail-value">${b.guests}</span></div>
      <div class="detail-row"><span class="detail-label">ჯამი</span><span class="detail-value" style="color:var(--gold);font-weight:700">${b.total_price?'$'+b.total_price:'—'}</span></div>
      <div class="detail-row"><span class="detail-label">სტატუსი</span><span class="detail-value"><span class="badge badge-${b.status}">${b.status}</span></span></div>
      ${b.special_requests ? `<div class="detail-row"><span class="detail-label">სურვილები</span><span class="detail-value">${b.special_requests}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">დათარიღება</span><span class="detail-value" style="color:var(--muted)">${b.created_at}</span></div>
    `;
    const footer = document.getElementById('booking-detail-footer');
    footer.innerHTML = `
      <div class="status-btns">
        <button class="status-btn confirm" onclick="Admin.updateBookingStatus(${b.id},'confirmed')"><i class="fa-solid fa-check"></i> დადასტურება</button>
        <button class="status-btn cancel" onclick="Admin.updateBookingStatus(${b.id},'cancelled')"><i class="fa-solid fa-xmark"></i> გაუქმება</button>
      </div>
    `;
    document.getElementById('booking-detail-modal').classList.add('open');
  },

  closeBookingModal() { document.getElementById('booking-detail-modal').classList.remove('open'); },

  async updateBookingStatus(id, status) {
    try {
      await this.api(`/api/admin/bookings/${id}`, 'PUT', { status });
      this.closeBookingModal();
      this.loadBookings();
      this.toast(`✅ სტატუსი: ${status}`, 's');
    } catch(e) { this.toast('❌ შეცდომა', 'e'); }
  },

  async deleteBooking(id) {
    if (!this.confirm('წაშლა?')) return;
    try { await this.api(`/api/admin/bookings/${id}`, 'DELETE'); this.loadBookings(); this.toast('✅ წაიშალა', 's'); }
    catch(e) { this.toast('❌ შეცდომა', 'e'); }
  },

  // ── MESSAGES ──────────────────────────────────────────────────────────────
  async loadMessages() {
    try {
      const msgs = await this.api('/api/admin/messages');
      const list = document.getElementById('messages-list');
      if (!list) return;
      if (!msgs.length) { list.innerHTML = '<p style="color:var(--muted);padding:20px">შეტყობინება არ არის</p>'; return; }
      list.innerHTML = msgs.map(m => `
        <div class="message-item ${m.status}" onclick="Admin.viewMessage(${m.id}, this)" data-id="${m.id}">
          <div class="msg-info">
            <div class="msg-sender">${m.name} <small style="color:var(--muted)">&lt;${m.email}&gt;</small></div>
            <div class="msg-subject">${m.subject||'(სათაური არ არის)'}</div>
            <div class="msg-preview">${m.message}</div>
          </div>
          <div class="msg-meta">
            <span class="badge badge-${m.status}">${m.status}</span>
            <div style="margin-top:6px">${m.created_at?.slice(0,10)||''}</div>
          </div>
        </div>
      `).join('');
      this.allMessages = msgs;
    } catch(e) { this.toast('Messages load error', 'e'); }
  },

  allMessages: [],

  viewMessage(id, el) {
    const m = this.allMessages.find(x => x.id === id);
    if (!m) return;
    document.getElementById('message-detail-body').innerHTML = `
      <div class="detail-row"><span class="detail-label">სახელი</span><span class="detail-value">${m.name}</span></div>
      <div class="detail-row"><span class="detail-label">ელ-ფოსტა</span><span class="detail-value"><a href="mailto:${m.email}" style="color:var(--blue)">${m.email}</a></span></div>
      ${m.phone ? `<div class="detail-row"><span class="detail-label">ტელ.</span><span class="detail-value">${m.phone}</span></div>` : ''}
      <div class="detail-row"><span class="detail-label">თემა</span><span class="detail-value">${m.subject||'—'}</span></div>
      <div class="detail-row"><span class="detail-label">შეტყობინება</span><span class="detail-value" style="white-space:pre-wrap">${m.message}</span></div>
      <div class="detail-row"><span class="detail-label">თარიღი</span><span class="detail-value" style="color:var(--muted)">${m.created_at}</span></div>
    `;
    document.getElementById('message-detail-footer').innerHTML = `
      <a href="mailto:${m.email}" class="btn-save" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;margin-right:auto">
        <i class="fa-solid fa-reply"></i> პასუხის გაგზავნა
      </a>
      <button class="btn-cancel" onclick="Admin.closeMessageModal()">დახურვა</button>
      <button class="act-btn delete" onclick="Admin.deleteMessage(${m.id})"><i class="fa-solid fa-trash"></i> წაშლა</button>
    `;
    document.getElementById('message-detail-modal').classList.add('open');
    // Mark as read
    if (m.status === 'unread') {
      this.api(`/api/admin/messages/${id}`, 'PUT', { status: 'read' }).then(() => {
        m.status = 'read';
        el?.classList.remove('unread'); el?.classList.add('read');
        el?.querySelector('.badge-unread')?.classList.replace('badge-unread','badge-read');
      });
    }
  },

  closeMessageModal() { document.getElementById('message-detail-modal').classList.remove('open'); },

  async deleteMessage(id) {
    if (!this.confirm('წაშლა?')) return;
    try {
      await this.api(`/api/admin/messages/${id}`, 'DELETE');
      this.closeMessageModal();
      this.loadMessages();
      this.toast('✅ წაიშალა', 's');
    } catch(e) { this.toast('❌ შეცდომა', 'e'); }
  },

  // ── TESTIMONIALS ──────────────────────────────────────────────────────────
  allTestimonials: [],
  async loadTestimonials() {
    try {
      this.allTestimonials = await this.api('/api/admin/testimonials');
      const grid = document.getElementById('testimonials-grid');
      if (!grid) return;
      grid.innerHTML = this.allTestimonials.map(t => `
        <div class="test-admin-card">
          <div class="test-admin-header">
            <div>
              <div class="test-admin-name">${t.flag||''} ${t.name}</div>
              <div class="test-admin-country">${t.country||''}</div>
            </div>
            <span style="color:var(--gold);font-size:0.8rem">${'★'.repeat(t.rating)}</span>
          </div>
          <p class="test-admin-text">${t.text?.slice(0,150)}${t.text?.length>150?'...':''}</p>
          <div class="test-admin-footer">
            <div>
              <span class="badge ${t.approved?'badge-active':'badge-inactive'}" style="margin-right:4px">${t.approved?'Approved':'Hidden'}</span>
              ${t.featured?'<span class="badge badge-yes">⭐ Featured</span>':''}
            </div>
            <div class="act-btns">
              <button class="act-btn edit" onclick="Admin.openTestModal(${t.id})"><i class="fa-solid fa-pen"></i></button>
              <button class="act-btn delete" onclick="Admin.deleteTestimonial(${t.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `).join('');
    } catch(e) { this.toast('Load error', 'e'); }
  },

  openTestModal(id = null) {
    const form = document.getElementById('test-form');
    form.reset();
    form.querySelector('[name="id"]').value = '';
    if (id) {
      const t = this.allTestimonials.find(x => x.id === id);
      if (t) {
        form.querySelector('[name="id"]').value = t.id;
        form.querySelector('[name="name"]').value = t.name||'';
        form.querySelector('[name="country"]').value = t.country||'';
        form.querySelector('[name="flag"]').value = t.flag||'';
        form.querySelector('[name="rating"]').value = t.rating||5;
        form.querySelector('[name="tour_name"]').value = t.tour_name||'';
        form.querySelector('[name="text"]').value = t.text||'';
        form.querySelector('[name="approved"]').checked = !!t.approved;
        form.querySelector('[name="featured"]').checked = !!t.featured;
      }
    }
    document.getElementById('test-form-modal').classList.add('open');
  },

  closeTestModal() { document.getElementById('test-form-modal').classList.remove('open'); },

  async saveTestimonial(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.approved = fd.get('approved') === '1' ? 1 : 0;
    data.featured = fd.get('featured') === '1' ? 1 : 0;
    const id = data.id; delete data.id;
    try {
      if (id) await this.api(`/api/admin/testimonials/${id}`, 'PUT', data);
      else await this.api('/api/admin/testimonials', 'POST', data);
      this.closeTestModal();
      this.loadTestimonials();
      this.toast('✅ შენახულია', 's');
    } catch(err) { this.toast('❌ ' + err.message, 'e'); }
  },

  async deleteTestimonial(id) {
    if (!this.confirm('წაშლა?')) return;
    try { await this.api(`/api/admin/testimonials/${id}`, 'DELETE'); this.loadTestimonials(); this.toast('✅ წაიშალა', 's'); }
    catch(e) { this.toast('❌ შეცდომა', 'e'); }
  },

  // ── CARS ──────────────────────────────────────────────────────────────────
  allCars: [],
  async loadCars() {
    try {
      this.allCars = await this.api('/api/admin/cars');
      const grid = document.getElementById('cars-admin-grid');
      if (!grid) return;
      if (!this.allCars.length) {
        grid.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted)">მანქანა არ არის დამატებული. დააჭირე "ახალი მანქანა"</div>';
        return;
      }
      const catLabel = { economy:'ეკონომი', jeep:'ჯიპი / 4WD', vip:'VIP', minivan:'მინივენი' };
      grid.innerHTML = this.allCars.map(c => `
        <div class="cars-admin-card">
          <div class="cars-admin-img-wrap">
            ${c.image
              ? `<img class="cars-admin-img" src="${c.image}" alt="${c.name}" onerror="this.style.display='none'" />`
              : `<div class="cars-no-img"><i class="fa-solid fa-car"></i></div>`}
            <span class="cars-cat-badge">${catLabel[c.category]||c.category}</span>
          </div>
          <div class="cars-admin-info">
            <div class="cars-admin-name">${c.name}</div>
            <div class="cars-admin-meta">
              <span><i class="fa-solid fa-user-group"></i> ${c.seats} სავარძ.</span>
              ${c.price_per_day ? `<span><i class="fa-solid fa-dollar-sign"></i> ${c.price_per_day}/დღე</span>` : ''}
            </div>
            ${c.description ? `<div class="cars-admin-desc">${c.description.slice(0,80)}${c.description.length>80?'...':''}</div>` : ''}
            <div class="cars-admin-footer">
              <span class="badge ${c.available?'badge-active':'badge-inactive'}">${c.available?'ხელმისაწვდ.':'მიუწვდ.'}</span>
              <div class="act-btns">
                <button class="act-btn edit" onclick="Admin.openCarModal(${c.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="act-btn delete" onclick="Admin.deleteCar(${c.id})"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    } catch(e) { this.toast('Cars load error', 'e'); }
  },

  openCarModal(id = null) {
    const form = document.getElementById('car-form');
    form.reset();
    form.querySelector('[name="id"]').value = '';
    document.getElementById('car-modal-title').textContent = id ? 'მანქანის რედ.' : 'ახალი მანქანა';
    document.getElementById('car-img-preview').innerHTML = '';
    const fp = document.getElementById('car-file-pick'); if (fp) fp.value = '';
    if (id) {
      const c = this.allCars.find(x => x.id === id);
      if (c) {
        form.querySelector('[name="id"]').value = c.id;
        form.querySelector('[name="name"]').value = c.name||'';
        form.querySelector('[name="description"]').value = c.description||'';
        form.querySelector('[name="seats"]').value = c.seats||4;
        form.querySelector('[name="category"]').value = c.category||'economy';
        form.querySelector('[name="price_per_day"]').value = c.price_per_day||'';
        form.querySelector('[name="image"]').value = c.image||'';
        form.querySelector('[name="features"]').value = c.features||'';
        form.querySelector('[name="available"]').value = c.available?'1':'0';
        if (c.image) document.getElementById('car-img-preview').innerHTML = `<img src="${c.image}" onerror="this.style.display='none'" />`;
      }
    }
    document.getElementById('car-form-modal').classList.add('open');
  },

  closeCarModal() { document.getElementById('car-form-modal').classList.remove('open'); },

  async saveCar(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const id = data.id; delete data.id;
    try {
      if (id) await this.api(`/api/admin/cars/${id}`, 'PUT', data);
      else await this.api('/api/admin/cars', 'POST', data);
      this.closeCarModal();
      this.loadCars();
      this.toast(id ? '✅ მანქანა განახლდა' : '✅ მანქანა დაემატა', 's');
    } catch(err) { this.toast('❌ ' + err.message, 'e'); }
  },

  async deleteCar(id) {
    if (!this.confirm('წაშლა?')) return;
    try { await this.api(`/api/admin/cars/${id}`, 'DELETE'); this.loadCars(); this.toast('✅ წაიშალა', 's'); }
    catch(e) { this.toast('❌ შეცდომა', 'e'); }
  },

  // ── GALLERY ───────────────────────────────────────────────────────────────
  allGallery: [],
  async loadGallery() {
    try {
      this.allGallery = await this.api('/api/admin/gallery');
      const grid = document.getElementById('gallery-admin-grid');
      if (!grid) return;
      grid.innerHTML = this.allGallery.map(g => `
        <div class="gallery-admin-card">
          <img class="gallery-admin-img" src="${g.image}" alt="${g.title||''}" onerror="this.src=''" />
          <div class="gallery-admin-info">
            <div class="gallery-admin-title">${g.title||'(სათაური)'}</div>
            <div style="font-size:0.7rem;color:var(--muted);margin-bottom:8px">${g.category}</div>
            <div class="gallery-admin-footer">
              <button class="act-btn edit" onclick="Admin.openGalleryModal(${g.id})"><i class="fa-solid fa-pen"></i></button>
              <button class="act-btn delete" onclick="Admin.deleteGallery(${g.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>
      `).join('');
    } catch(e) { this.toast('Gallery load error', 'e'); }
  },

  openGalleryModal(id = null) {
    const form = document.getElementById('gallery-form');
    form.reset();
    form.querySelector('[name="id"]').value = '';
    document.getElementById('gallery-preview').innerHTML = '';
    const fp = document.getElementById('gallery-file-pick'); if (fp) fp.value = '';
    if (id) {
      const g = this.allGallery.find(x => x.id === id);
      if (g) {
        form.querySelector('[name="id"]').value = g.id;
        form.querySelector('[name="title"]').value = g.title||'';
        form.querySelector('[name="image"]').value = g.image||'';
        form.querySelector('[name="category"]').value = g.category||'nature';
        if (g.image) document.getElementById('gallery-preview').innerHTML = `<img src="${g.image}" />`;
      }
    }
    document.getElementById('gallery-form-modal').classList.add('open');
  },

  closeGalleryModal() { document.getElementById('gallery-form-modal').classList.remove('open'); },

  async saveGallery(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    const id = data.id; delete data.id;
    try {
      if (id) await this.api(`/api/admin/gallery/${id}`, 'PUT', { ...data, active: 1 });
      else await this.api('/api/admin/gallery', 'POST', data);
      this.closeGalleryModal();
      this.loadGallery();
      this.toast('✅ შენახულია', 's');
    } catch(err) { this.toast('❌ ' + err.message, 'e'); }
  },

  async deleteGallery(id) {
    if (!this.confirm('წაშლა?')) return;
    try { await this.api(`/api/admin/gallery/${id}`, 'DELETE'); this.loadGallery(); this.toast('✅ წაიშალა', 's'); }
    catch(e) { this.toast('❌ შეცდომა', 'e'); }
  },

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  async loadSettings() {
    try {
      const s = await this.api('/api/admin/settings');
      const form = document.getElementById('settings-form');
      if (!form) return;
      Object.entries(s).forEach(([k, v]) => {
        const el = form.querySelector(`[name="${k}"]`);
        if (el) el.value = v;
      });
    } catch(e) { this.toast('Settings load error', 'e'); }
  },

  async saveSettings(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await this.api('/api/admin/settings', 'PUT', data);
      this.toast('✅ პარამეტრები შენახულია', 's');
    } catch(err) { this.toast('❌ ' + err.message, 'e'); }
  },

  // ── IMAGE UPLOAD HELPER ───────────────────────────────────────────────────
  compressImage(file, maxWidth = 1200, quality = 0.82) {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height;
          if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  async changePassword(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const current = fd.get('current'), newpass = fd.get('newpass'), confirm = fd.get('confirm');
    if (newpass !== confirm) { this.toast('❌ პაროლები არ ემთხვევა', 'e'); return; }
    if (newpass.length < 6) { this.toast('❌ მინ. 6 სიმბოლო', 'e'); return; }
    try {
      await this.api('/api/admin/password', 'PUT', { current, newpass });
      e.target.reset();
      this.toast('✅ პაროლი შეიცვალა', 's');
    } catch(err) { this.toast('❌ ' + err.message, 'e'); }
  }
};

// ── GLOBAL HELPERS ─────────────────────────────────────────────────────────
window.navigateTo = (page) => Admin.navigateTo(page);
window.Admin = Admin;

document.addEventListener('DOMContentLoaded', () => Admin.init());
