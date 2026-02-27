/* ═══════════════════════════════════════════════════════════════
   GEORGIA PREMIUM TRIPS — Chatbot Widget
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const Chat = {
  history: [],
  isOpen: false,
  isTyping: false,

  init() {
    const toggle = document.getElementById('chatbot-toggle');
    const minimize = document.getElementById('chat-minimize');
    const sendBtn = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');
    const badge = document.getElementById('chat-badge');

    toggle?.addEventListener('click', () => {
      if (typeof Sound !== 'undefined') this.isOpen ? Sound.close() : Sound.open();
      this.isOpen ? this.close() : this.open();
    });

    minimize?.addEventListener('click', () => {
      if (typeof Sound !== 'undefined') Sound.close();
      this.close();
    });

    sendBtn?.addEventListener('click', () => this.sendMessage());

    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.sendMessage(); }
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.textContent;
        this.sendMessage();
        if (typeof Sound !== 'undefined') Sound.click();
      });
    });

    // Auto-show badge pulse after 4 seconds
    setTimeout(() => { badge?.classList.remove('hide'); }, 4000);

    // Auto-open hint after 12 seconds if not interacted
    let autoOpened = false;
    const autoOpen = setTimeout(() => {
      if (!this.isOpen && !autoOpened) {
        autoOpened = true;
        this.open();
        this.addBotMessage('გამარჯობა! 👋 გსურთ ინფორმაცია ჩვენი ტურების შესახებ?');
      }
    }, 12000);

    // Cancel auto-open on any scroll
    window.addEventListener('scroll', () => { clearTimeout(autoOpen); autoOpened = true; }, { once: true, passive: true });
  },

  open() {
    const widget = document.getElementById('chatbot-widget');
    const window_ = document.getElementById('chatbot-window');
    const badge = document.getElementById('chat-badge');
    widget?.classList.add('open');
    window_?.classList.add('open');
    badge?.classList.add('hide');
    this.isOpen = true;
    setTimeout(() => document.getElementById('chat-input')?.focus(), 300);
    this.scrollToBottom();
  },

  close() {
    const widget = document.getElementById('chatbot-widget');
    const window_ = document.getElementById('chatbot-window');
    widget?.classList.remove('open');
    window_?.classList.remove('open');
    this.isOpen = false;
  },

  addUserMessage(text) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.innerHTML = `
      <div class="msg-bubble">${this.escape(text)}</div>
      <div class="msg-avatar">👤</div>
    `;
    messages.appendChild(div);
    this.history.push({ role: 'user', content: text });
    this.scrollToBottom();
  },

  addBotMessage(text) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = `
      <div class="msg-avatar">🇬🇪</div>
      <div class="msg-bubble">${this.formatMessage(text)}</div>
    `;
    messages.appendChild(div);
    this.history.push({ role: 'assistant', content: text });
    this.scrollToBottom();
    if (typeof Sound !== 'undefined') Sound.play(440, 'sine', 0.05, 0.03);
  },

  showTyping() {
    const messages = document.getElementById('chat-messages');
    if (!messages || this.isTyping) return;
    this.isTyping = true;
    const div = document.createElement('div');
    div.className = 'chat-msg bot'; div.id = 'typing-indicator';
    div.innerHTML = `
      <div class="msg-avatar">🇬🇪</div>
      <div class="msg-bubble msg-typing">
        <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
      </div>
    `;
    messages.appendChild(div);
    this.scrollToBottom();
  },

  hideTyping() {
    document.getElementById('typing-indicator')?.remove();
    this.isTyping = false;
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    // Hide suggestions after first message
    document.getElementById('chat-suggestions')?.style.setProperty('display', 'none');

    this.addUserMessage(text);
    this.showTyping();

    // Simulate typing delay for realism
    const delay = 500 + Math.random() * 800;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: this.history.slice(-10) })
      });
      const data = await res.json();
      setTimeout(() => {
        this.hideTyping();
        this.addBotMessage(data.response);
        // Check if response contains a booking keyword — show CTA
        if (data.response.toLowerCase().includes('book') || data.response.toLowerCase().includes('ჯავშნ')) {
          this.addQuickAction();
        }
      }, delay);
    } catch(e) {
      setTimeout(() => {
        this.hideTyping();
        this.addBotMessage('❌ დამიკავშირდით პირდაპირ: +995 555 100 200');
      }, delay);
    }
  },

  addQuickAction() {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = `
      <div class="msg-avatar">🇬🇪</div>
      <div class="msg-bubble" style="padding:8px">
        <a href="#booking" onclick="Chat.close()" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:var(--gold);color:#000;border-radius:8px;font-size:0.82rem;font-weight:700;text-decoration:none">
          <i class="fa-solid fa-calendar-check"></i> დაჯავშნე ახლა
        </a>
      </div>
    `;
    messages.appendChild(div);
    this.scrollToBottom();
  },

  scrollToBottom() {
    const messages = document.getElementById('chat-messages');
    if (messages) setTimeout(() => { messages.scrollTop = messages.scrollHeight; }, 50);
  },

  escape(text) {
    return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  formatMessage(text) {
    return this.escape(text)
      .replace(/\n/g, '<br>')
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
};

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => Chat.init());
window.Chat = Chat;
