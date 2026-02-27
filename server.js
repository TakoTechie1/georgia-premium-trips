require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'georgia-premium-secret-2025';

// ─── Database ────────────────────────────────────────────────────────────────
const dbPath = process.env.VERCEL ? '/tmp/database.db' : path.join(__dirname, 'database.db');
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      short_description TEXT,
      duration TEXT,
      price INTEGER,
      original_price INTEGER,
      image TEXT,
      category TEXT DEFAULT 'tour',
      included TEXT,
      highlights TEXT,
      difficulty TEXT DEFAULT 'Easy',
      max_group INTEGER DEFAULT 12,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_ref TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      tour_id INTEGER,
      tour_name TEXT,
      date TEXT,
      guests INTEGER DEFAULT 1,
      special_requests TEXT,
      status TEXT DEFAULT 'pending',
      total_price INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tour_id) REFERENCES tours(id)
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT,
      flag TEXT,
      rating INTEGER DEFAULT 5,
      text TEXT,
      avatar TEXT,
      tour_name TEXT,
      approved INTEGER DEFAULT 1,
      featured INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT,
      message TEXT,
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image TEXT NOT NULL,
      category TEXT DEFAULT 'nature',
      active INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Default admin
  const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('georgia2025', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
    console.log('✅ Default admin: admin / georgia2025');
  }

  // Default tours
  const tourCount = db.prepare('SELECT COUNT(*) as c FROM tours').get().c;
  if (tourCount === 0) {
    const tours = [
      {
        name: 'თბილისის საოცნებო ტური',
        description: 'გამოიკვლიეთ საქართველოს მაგიური კაპიტალი - თბილისი. ძველი ქალაქის ვიწრო ქუჩები, ნარიყალა, მეტეხი, სიონის ტაძარი და ცნობილი გოგირდის აბანოები. ექსპერტ გიდთან ერთად ჩაეფლვით ქართული კულტურის სიღრმეში.',
        short_description: 'ძველი თბილისის მაგიური გამოკვლევა',
        duration: '8 საათი', price: 150, original_price: 200,
        image: 'https://images.unsplash.com/photo-1556566464-14f16d840f0e?auto=format&fit=crop&w=800&q=80',
        category: 'city', included: 'ტრანსპორტი,გიდი,სადილი,ყველა შესასვლელი',
        highlights: 'ნარიყალა,მეტეხი,სიონი,ქარვასლა,გოგირდის აბანოები', difficulty: 'Easy', max_group: 15, featured: 1
      },
      {
        name: 'ყაზბეგი — კავკასიონის გული',
        description: 'მოინახულეთ ლეგენდარული გერგეთის სამება — ეკლესია 2170 მეტრ სიმაღლეზე, კავკასიონის მთიანი პეიზაჟების ფონზე. ეს ტური ნამდვილი სახის საქართველოს სიამოვნებაა.',
        short_description: 'კავკასიონის ყველაზე ლამაზი ხედები',
        duration: '2 დღე', price: 280, original_price: 360,
        image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=800&q=80',
        category: 'adventure', included: 'ტრანსპორტი,გიდი,4★ სასტუმრო,კვება',
        highlights: 'გერგეთის სამება,ყაზბეგი,ჩეთნელი,დარიალის ხეობა', difficulty: 'Moderate', max_group: 10, featured: 1
      },
      {
        name: 'კახეთი — ღვინის სამეფო',
        description: 'კახეთი — მსოფლიოში ღვინის დაბადების ადგილი. 8000 წლის ტრადიცია, თიხის ქვევრები, ოჯახური მარნები და სიღნაღის ზღაპრული ქალაქი. ეს ტური ყველა გრძნობას გაუღვიძებს.',
        short_description: 'ღვინო, ისტორია და განსაცვიფრებელი ბუნება',
        duration: '1 დღე', price: 120, original_price: 160,
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
        category: 'cultural', included: 'ტრანსპორტი,გიდი,ღვინის დეგუსტაცია,სადილი',
        highlights: 'სიღნაღი,ბოდბე,ნინოწმინდა,ალავერდი', difficulty: 'Easy', max_group: 15, featured: 1
      },
      {
        name: 'ბათუმი — შავი ზღვა',
        description: 'ბათუმი — ეს სხვა სამყაროა. ულამაზესი ბოტანიკური ბაღი, შავი ზღვის სანაპირო, თანამედროვე არქიტექტურა და ნაყოფიერი ღამის ცხოვრება. ეს ტური ყველასთვის განსხვავებულია.',
        short_description: 'საქართველოს მარგალიტი შავ ზღვაზე',
        duration: '2 დღე', price: 250, original_price: 330,
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        category: 'beach', included: 'ტრანსპორტი,გიდი,სასტუმრო,ექსკურსიები',
        highlights: 'ბოტანიკური ბაღი,ბულვარი,ბათუმის ციხე,მაქინჯაური', difficulty: 'Easy', max_group: 12, featured: 0
      },
      {
        name: 'სვანეთი — ტყეები და კოშკები',
        description: 'სვანეთი — UNESCO-ს მსოფლიო მემკვიდრეობის ძეგლი კავკასიონის გულში. შუა საუკუნეების კოშკები, ალპური ტრეკინგი და ქართული სტუმარმასპინძლობა, რომელიც მთელ ცხოვრებაში გახსოვთ.',
        short_description: 'UNESCO ძეგლი — ბუნება და ისტორია',
        duration: '3 დღე', price: 420, original_price: 550,
        image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        category: 'adventure', included: 'ტრანსპორტი,გიდი,სასტუმრო,კვება,ყველა შესასვლელი',
        highlights: 'მესტია,ადიში,ჩაჟვასი,ზუბი,ჰათვალი', difficulty: 'Moderate', max_group: 8, featured: 1
      },
      {
        name: 'საქართველო სრულად — VIP 7 დღე',
        description: 'საქართველოს ყველა სასწაული ერთ მარშრუტში — თბილისიდან ყაზბეგამდე, კახეთიდან ბათუმამდე, სვანეთამდე. 5-ვარსკვლავიანი სასტუმრო, პირადი გიდი, VIP ტრანსფერი. ეს ტური არ ივიწყება.',
        short_description: 'საქართველოს სრული VIP გამოცდილება',
        duration: '7 დღე', price: 1200, original_price: 1600,
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80',
        category: 'premium', included: 'ყველა ტრანსპორტი,გიდი,5★ სასტუმრო,ყველა კვება,ყველა შესასვლელი,ღვინო',
        highlights: 'თბილისი,მცხეთა,ყაზბეგი,სვანეთი,კახეთი,ბათუმი,ქუთაისი', difficulty: 'Easy', max_group: 6, featured: 1
      }
    ];
    const ins = db.prepare(`INSERT INTO tours (name,description,short_description,duration,price,original_price,image,category,included,highlights,difficulty,max_group,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    tours.forEach(t => ins.run(t.name, t.description, t.short_description, t.duration, t.price, t.original_price, t.image, t.category, t.included, t.highlights, t.difficulty, t.max_group, t.featured));
  }

  // Default testimonials
  const testCount = db.prepare('SELECT COUNT(*) as c FROM testimonials').get().c;
  if (testCount === 0) {
    const tests = [
      { name: 'Sarah Johnson', country: 'USA', flag: '🇺🇸', rating: 5, text: 'Absolutely breathtaking! The Kazbegi tour was the highlight of my entire year. Our guide Giorgi was incredibly knowledgeable and the views of Gergeti Trinity Church left me speechless. Worth every penny!', tour_name: 'ყაზბეგი — კავკასიონის გული', featured: 1 },
      { name: 'Marco Rossi', country: 'Italy', flag: '🇮🇹', rating: 5, text: 'Georgia è magica, e Georgia Premium ha reso tutto ancora più speciale. Il wine tour in Kakheti era semplicemente perfetto. I vini georgiani sono incredibili — 8000 anni di tradizione!', tour_name: 'კახეთი — ღვინის სამეფო', featured: 1 },
      { name: 'Anna Schmidt', country: 'Germany', flag: '🇩🇪', rating: 5, text: 'Perfect from start to finish. The 7-day VIP tour covered everything Georgia has to offer. Premium vehicles, expert guides, stunning hotels. We felt like royalty throughout the entire journey!', tour_name: 'საქართველო სრულად — VIP 7 დღე', featured: 1 },
      { name: 'James Wilson', country: 'UK', flag: '🇬🇧', rating: 5, text: 'Tbilisi is now my absolute favorite city in the world. The old town, the sulfur baths, the food — incredible! Our guide made the city come alive with stories of Georgian history.', tour_name: 'თბილისის საოცნებო ტური', featured: 1 },
      { name: 'Sophie Martin', country: 'France', flag: '🇫🇷', rating: 5, text: 'Svaneti m\'a coupé le souffle! Les tours médiévales, les montagnes, l\'hospitalité géorgienne — tout était parfait. Je recommande vivement cette agence à tous mes amis voyageurs!', tour_name: 'სვანეთი — ტყეები და კოშკები', featured: 1 },
      { name: 'Yuki Tanaka', country: 'Japan', flag: '🇯🇵', rating: 5, text: 'ジョージアは想像以上に美しい国でした。プロのガイドと豪華な車で快適に観光できました。カズベギの景色は一生忘れられません！', tour_name: 'ყაზბეგი — კავკასიონის გული', featured: 0 }
    ];
    const ins2 = db.prepare(`INSERT INTO testimonials (name,country,flag,rating,text,tour_name,approved,featured) VALUES (?,?,?,?,?,?,1,?)`);
    tests.forEach(t => ins2.run(t.name, t.country, t.flag, t.rating, t.text, t.tour_name, t.featured));
  }

  // Default gallery
  const galCount = db.prepare('SELECT COUNT(*) as c FROM gallery').get().c;
  if (galCount === 0) {
    const photos = [
      { title: 'გერგეთის სამება', image: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?auto=format&fit=crop&w=600&q=80', category: 'mountains' },
      { title: 'ძველი თბილისი', image: 'https://images.unsplash.com/photo-1556566464-14f16d840f0e?auto=format&fit=crop&w=600&q=80', category: 'city' },
      { title: 'კახეთის ვენახები', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80', category: 'nature' },
      { title: 'სვანეთის კოშკები', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80', category: 'mountains' },
      { title: 'ბათუმის სანაპირო', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80', category: 'beach' },
      { title: 'კავკასიონი', image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80', category: 'mountains' },
      { title: 'მცხეთა — ძველი დედაქალაქი', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80', category: 'cultural' },
      { title: 'ქართული სამზარეულო', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80', category: 'food' },
      { title: 'მცხეთის ჯვარი', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80', category: 'cultural' },
      { title: 'მიხეილ ტბა', image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80', category: 'nature' },
      { title: 'ქართული ღვინო', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=600&q=80', category: 'food' },
      { title: 'ალაზნის ველი', image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80', category: 'nature' }
    ];
    const ins3 = db.prepare(`INSERT INTO gallery (title,image,category) VALUES (?,?,?)`);
    photos.forEach(p => ins3.run(p.title, p.image, p.category));
  }

  // Default settings
  const defaults = [
    ['site_title', 'Georgia Premium Trips'],
    ['site_subtitle', 'Discover Georgia in Style'],
    ['tagline', 'Where Ancient History Meets Breathtaking Nature'],
    ['phone', '+995 555 100 200'],
    ['email', 'info@georgiatrips.ge'],
    ['address', 'Rustaveli Ave 42, Tbilisi, Georgia 0108'],
    ['whatsapp', '+995555100200'],
    ['instagram', 'georgiapremiumtrips'],
    ['facebook', 'georgiapremiumtrips'],
    ['youtube', 'georgiapremiumtrips'],
    ['chatbot_enabled', 'true'],
    ['booking_enabled', 'true'],
    ['hero_video', ''],
    ['announcement', ''],
    ['rating', '4.9'],
    ['clients_served', '2400'],
    ['years_experience', '12'],
    ['tours_count', '50+']
  ];
  const ins4 = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  defaults.forEach(([k, v]) => ins4.run(k, v));
}

initDB();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});

app.get('/api/tours', (req, res) => {
  const { category, featured } = req.query;
  let q = 'SELECT * FROM tours WHERE active=1';
  const p = [];
  if (category) { q += ' AND category=?'; p.push(category); }
  if (featured) { q += ' AND featured=1'; }
  q += ' ORDER BY featured DESC, order_index, id';
  res.json(db.prepare(q).all(...p));
});

app.get('/api/tours/:id', (req, res) => {
  const t = db.prepare('SELECT * FROM tours WHERE id=? AND active=1').get(req.params.id);
  t ? res.json(t) : res.status(404).json({ error: 'Not found' });
});

app.get('/api/testimonials', (req, res) => {
  res.json(db.prepare('SELECT * FROM testimonials WHERE approved=1 ORDER BY featured DESC, id').all());
});

app.get('/api/gallery', (req, res) => {
  const { category } = req.query;
  let q = 'SELECT * FROM gallery WHERE active=1';
  const p = [];
  if (category && category !== 'all') { q += ' AND category=?'; p.push(category); }
  q += ' ORDER BY order_index, id';
  res.json(db.prepare(q).all(...p));
});

app.post('/api/bookings', (req, res) => {
  const { name, email, phone, tour_id, date, guests, special_requests } = req.body;
  if (!name?.trim() || !email?.trim()) return res.status(400).json({ error: 'Name and email required' });
  const tour = tour_id ? db.prepare('SELECT * FROM tours WHERE id=?').get(tour_id) : null;
  const ref = 'GP-' + Date.now().toString(36).toUpperCase().slice(-6);
  const total = tour ? tour.price * (parseInt(guests) || 1) : null;
  db.prepare(`INSERT INTO bookings (booking_ref,name,email,phone,tour_id,tour_name,date,guests,special_requests,total_price) VALUES (?,?,?,?,?,?,?,?,?,?)`).run(ref, name.trim(), email.trim(), phone || null, tour_id || null, tour?.name || null, date || null, parseInt(guests) || 1, special_requests || null, total);
  res.json({ success: true, booking_ref: ref, message: 'დაჯავშნა მიღებულია! მალე დაგიკავშირდებით.' });
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) return res.status(400).json({ error: 'Required fields missing' });
  db.prepare(`INSERT INTO messages (name,email,phone,subject,message) VALUES (?,?,?,?,?)`).run(name.trim(), email.trim(), phone || null, subject || null, message.trim());
  res.json({ success: true, message: 'შეტყობინება გაგზავნილია!' });
});

// ─── CHATBOT ──────────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

  // Optional Claude AI integration
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msgs = [
        ...history.slice(-8).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: message }
      ];
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: `You are a helpful travel assistant for "Georgia Premium Trips", a luxury travel company in Georgia (the Caucasus country).
Be friendly, concise, and enthusiastic about Georgia. Answer questions about tours, pricing, booking, and Georgian culture.
Tours: Tbilisi City Tour ($150/8h), Kazbegi Mountain ($280/2d), Kakheti Wine ($120/1d), Batumi Beach ($250/2d), Svaneti ($420/3d), 7-Day VIP ($1200).
Contact: +995 555 100 200, info@georgiatrips.ge. Always end with an invitation to book or contact us. Keep replies under 100 words.`,
        messages: msgs
      });
      return res.json({ response: response.content[0].text, ai: true });
    } catch (e) {
      console.error('AI chat error:', e.message);
    }
  }

  // Rule-based fallback
  res.json({ response: getRuleResponse(message.toLowerCase()), ai: false });
});

function getRuleResponse(msg) {
  const rules = [
    { kw: ['hello','hi','hey','გამარჯობა','სალამ'], r: '🇬🇪 გამარჯობა! Welcome to Georgia Premium Trips! I\'m here to help you plan the perfect Georgian adventure. Ask me about our tours, prices, or booking!' },
    { kw: ['tour','ტური','trip','package','მოგზაურობ'], r: 'We offer 6 amazing tours:\n🏙️ Tbilisi City Tour - $150\n🏔️ Kazbegi Adventure - $280\n🍷 Kakheti Wine Tour - $120\n🌊 Batumi Beach - $250\n🗼 Svaneti - $420\n👑 7-Day VIP - $1,200\nWhich one interests you?' },
    { kw: ['price','cost','ფასი','how much','რა ღირ'], r: 'Our tours range from $120 (Kakheti) to $1,200 (7-Day VIP). All include transport, professional guide & meals. Groups of 4+ get 15% discount! 💰' },
    { kw: ['book','reserve','დაჯავშნ'], r: 'Book directly on our website via the Booking section, or contact us on WhatsApp: +995 555 100 200. We confirm within 2 hours! 📅' },
    { kw: ['kazbegi','ყაზბეგ','mountain','caucasus','gergeti','მთ'], r: '🏔️ Kazbegi is our most popular tour! Visit the iconic Gergeti Trinity Church at 2,170m altitude. 2 days, includes 4★ hotel. Price: $280 (was $360).' },
    { kw: ['tbilisi','თბილის','city','capital'], r: '🏛️ Tbilisi City Tour: Old Town, Narikala Fortress, Metekhi Church, sulfur baths, Rustaveli Ave & Georgian dinner! 8 hours, $150.' },
    { kw: ['kakheti','კახეთ','wine','ღვინ','vineyard'], r: '🍷 Kakheti Wine Tour: World\'s oldest wine region! 8,000-year tradition, wine tasting in traditional cellars, Signagi town, Bodbe Monastery. 1 day, $120.' },
    { kw: ['batumi','ბათუმ','beach','sea','შავი ზღვ'], r: '🌊 Batumi is Georgia\'s Black Sea gem! Botanical Garden, Batumi Boulevard, modern architecture & great seafood. 2 days, $250.' },
    { kw: ['svaneti','სვანეთ','tower','mestia','მესტ'], r: '🗼 Svaneti = UNESCO World Heritage Site. Medieval towers, alpine trekking, authentic Svan culture. 3 days, $420. One of the most unique places on Earth!' },
    { kw: ['7 day','7-day','week','full','vip','სრულ','7 დღ'], r: '👑 7-Day VIP Tour — the ultimate Georgia experience! All top destinations: Tbilisi, Mtskheta, Kazbegi, Svaneti, Kakheti, Batumi, Kutaisi. 5★ hotels, all meals, private guide. $1,200.' },
    { kw: ['food','eat','cuisine','khinkali','khachapuri','საჭმ'], r: '🍽️ Georgian cuisine is legendary! All tours include authentic meals: Khinkali (dumplings), Khachapuri (cheese bread), Mtsvadi (BBQ) & local wine. 100% included!' },
    { kw: ['hotel','accommodation','stay','სასტუმრ'], r: '🏨 Multi-day tours include 4-5★ hotels. We partner with the best hotels: boutique guesthouses in Old Tbilisi, mountain lodges in Kazbegi, historic hotels in Kutaisi.' },
    { kw: ['safe','safety','security','danger'], r: '✅ Georgia is one of the safest countries for tourism! Our vehicles have GPS, all guides are certified & we have 24/7 emergency support. Peace of mind guaranteed.' },
    { kw: ['weather','season','best time','when'], r: '☀️ Best time to visit: April-June (spring) & September-November (fall) — perfect weather, fewer crowds. Summer is great for beaches, winter for skiing in Gudauri!' },
    { kw: ['contact','phone','whatsapp','email'], r: '📞 +995 555 100 200\n📧 info@georgiatrips.ge\n💬 WhatsApp: +995 555 100 200\nWe reply within 1 hour!' },
    { kw: ['cancel','refund','cancell'], r: '✅ Flexible cancellation: Full refund 48h+ before departure, 50% refund 24-48h before. Your peace of mind is our priority!' },
    { kw: ['discount','promo','group','offer'], r: '🎉 Special offers:\n• Groups 4+: 15% off\n• Book 7-Day VIP: Save $400\n• Early bird (30+ days ahead): 10% off\nContact us for current promotions!' },
    { kw: ['thank','thanks','perfect','great','wonderful','amazing'], r: 'You\'re welcome! 🌟 Georgia Premium Trips is here to make your visit unforgettable. Feel free to ask anything — we love talking about Georgia! 🇬🇪' },
  ];
  for (const rule of rules) {
    if (rule.kw.some(k => msg.includes(k))) return rule.r;
  }
  return '🇬🇪 I\'d love to help! Ask me about tours, prices, booking, or anything about beautiful Georgia. Or call us directly: +995 555 100 200 for personalized advice!';
}

// ─── ADMIN API ────────────────────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE username=?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username: user.username });
});

app.get('/api/admin/stats', auth, (req, res) => {
  res.json({
    tours: db.prepare('SELECT COUNT(*) as c FROM tours WHERE active=1').get().c,
    bookings: db.prepare('SELECT COUNT(*) as c FROM bookings').get().c,
    pending: db.prepare('SELECT COUNT(*) as c FROM bookings WHERE status="pending"').get().c,
    confirmed: db.prepare('SELECT COUNT(*) as c FROM bookings WHERE status="confirmed"').get().c,
    messages: db.prepare('SELECT COUNT(*) as c FROM messages').get().c,
    unread: db.prepare('SELECT COUNT(*) as c FROM messages WHERE status="unread"').get().c,
    testimonials: db.prepare('SELECT COUNT(*) as c FROM testimonials WHERE approved=1').get().c,
    revenue: db.prepare('SELECT COALESCE(SUM(total_price),0) as s FROM bookings WHERE status="confirmed"').get().s,
    recent_bookings: db.prepare('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 7').all(),
    recent_messages: db.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 5').all()
  });
});

// Tours CRUD
app.get('/api/admin/tours', auth, (req, res) => res.json(db.prepare('SELECT * FROM tours ORDER BY order_index,id').all()));
app.post('/api/admin/tours', auth, (req, res) => {
  const { name, description, short_description, duration, price, original_price, image, category, included, highlights, difficulty, max_group, featured, active } = req.body;
  const r = db.prepare(`INSERT INTO tours (name,description,short_description,duration,price,original_price,image,category,included,highlights,difficulty,max_group,featured,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(name, description, short_description, duration, +price, +original_price, image, category, included, highlights, difficulty || 'Easy', +max_group || 12, featured ? 1 : 0, active !== false ? 1 : 0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/admin/tours/:id', auth, (req, res) => {
  const { name, description, short_description, duration, price, original_price, image, category, included, highlights, difficulty, max_group, featured, active } = req.body;
  db.prepare(`UPDATE tours SET name=?,description=?,short_description=?,duration=?,price=?,original_price=?,image=?,category=?,included=?,highlights=?,difficulty=?,max_group=?,featured=?,active=? WHERE id=?`).run(name, description, short_description, duration, +price, +original_price, image, category, included, highlights, difficulty, +max_group, featured ? 1 : 0, active ? 1 : 0, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/tours/:id', auth, (req, res) => {
  db.prepare('UPDATE tours SET active=0 WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Bookings
app.get('/api/admin/bookings', auth, (req, res) => res.json(db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all()));
app.put('/api/admin/bookings/:id', auth, (req, res) => {
  db.prepare('UPDATE bookings SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/bookings/:id', auth, (req, res) => {
  db.prepare('DELETE FROM bookings WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Messages
app.get('/api/admin/messages', auth, (req, res) => res.json(db.prepare('SELECT * FROM messages ORDER BY created_at DESC').all()));
app.put('/api/admin/messages/:id', auth, (req, res) => {
  db.prepare('UPDATE messages SET status=? WHERE id=?').run(req.body.status, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/messages/:id', auth, (req, res) => {
  db.prepare('DELETE FROM messages WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Testimonials CRUD
app.get('/api/admin/testimonials', auth, (req, res) => res.json(db.prepare('SELECT * FROM testimonials ORDER BY id DESC').all()));
app.post('/api/admin/testimonials', auth, (req, res) => {
  const { name, country, flag, rating, text, tour_name, approved, featured } = req.body;
  const r = db.prepare(`INSERT INTO testimonials (name,country,flag,rating,text,tour_name,approved,featured) VALUES (?,?,?,?,?,?,?,?)`).run(name, country, flag || '🌍', +rating || 5, text, tour_name, approved ? 1 : 0, featured ? 1 : 0);
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/admin/testimonials/:id', auth, (req, res) => {
  const { name, country, flag, rating, text, tour_name, approved, featured } = req.body;
  db.prepare(`UPDATE testimonials SET name=?,country=?,flag=?,rating=?,text=?,tour_name=?,approved=?,featured=? WHERE id=?`).run(name, country, flag, +rating, text, tour_name, approved ? 1 : 0, featured ? 1 : 0, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/testimonials/:id', auth, (req, res) => {
  db.prepare('DELETE FROM testimonials WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Gallery
app.get('/api/admin/gallery', auth, (req, res) => res.json(db.prepare('SELECT * FROM gallery ORDER BY order_index,id').all()));
app.post('/api/admin/gallery', auth, (req, res) => {
  const { title, image, category } = req.body;
  const r = db.prepare(`INSERT INTO gallery (title,image,category) VALUES (?,?,?)`).run(title, image, category || 'nature');
  res.json({ id: r.lastInsertRowid });
});
app.put('/api/admin/gallery/:id', auth, (req, res) => {
  const { title, image, category, active } = req.body;
  db.prepare(`UPDATE gallery SET title=?,image=?,category=?,active=? WHERE id=?`).run(title, image, category, active ? 1 : 0, req.params.id);
  res.json({ success: true });
});
app.delete('/api/admin/gallery/:id', auth, (req, res) => {
  db.prepare('DELETE FROM gallery WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Settings
app.get('/api/admin/settings', auth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
});
app.put('/api/admin/settings', auth, (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)');
  const tx = db.transaction(() => Object.entries(req.body).forEach(([k, v]) => upsert.run(k, v)));
  tx(); res.json({ success: true });
});

// Change password
app.put('/api/admin/password', auth, (req, res) => {
  const { current, newpass } = req.body;
  const user = db.prepare('SELECT * FROM admin_users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(current, user.password_hash)) return res.status(400).json({ error: 'Wrong current password' });
  db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(newpass, 10), req.user.id);
  res.json({ success: true });
});

// Admin SPA
app.get('/admin*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Start (local only — Vercel handles serving via module.exports)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   🇬🇪  GEORGIA PREMIUM TRIPS  🇬🇪     ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║  🌐 Website: http://localhost:${PORT}      ║`);
    console.log(`║  🔐 Admin:   http://localhost:${PORT}/admin ║`);
    console.log('║  👤 Login:   admin / georgia2025      ║');
    console.log('╚═══════════════════════════════════════╝\n');
  });
}

module.exports = app;
