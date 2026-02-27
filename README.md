# 🇬🇪 Georgia Premium Trips

**პროფესიონალური სატურო საიტი საქართველოზე — სრული Full-Stack**

🌐 **Live საიტი:** [georgia-premium.vercel.app](https://georgia-premium.vercel.app)
🔐 **Admin Panel:** [georgia-premium.vercel.app/admin](https://georgia-premium.vercel.app/admin)

---

## ✨ ფუნქციონალი

- 🎠 **Hero სლაიდშოუ** — 4 ავტომატური სლაიდი პარალაქს ეფექტით
- 🏔️ **6 პრემიუმ ტური** — თბილისი, ყაზბეგი, კახეთი, ბათუმი, სვანეთი, VIP 7 დღე
- 🤖 **AI ჩატბოტი** — ავტომატური პასუხები, Claude AI ინტეგრაცია
- 📅 **Online ჯავშანი** — 3-ეტაპიანი ფორმა, Email დადასტურება
- 🖼️ **გალერეა** — Masonry layout + Lightbox
- ⭐ **შეფასებები** — მსოფლიოს სტუმრების რეალური განხილვები
- 🔊 **ხმის ეფექტები** — Web Audio API (ფაილების გარეშე)
- ✨ **ანიმაციები** — AOS, Custom Cursor, Particle System
- 📱 **Responsive** — მობილური, ტაბლეტი, დესკტოპი

## 🔐 Admin Panel

| | |
|---|---|
| URL | `/admin` |
| Username | `admin` |
| Password | `georgia2025` |

**მართავს:** ტურები · ჯავშნები · შეტყობინებები · გალერეა · შეფასებები · პარამეტრები

## 🛠️ ტექნოლოგიები

| Layer | Stack |
|-------|-------|
| Backend | Node.js + Express.js |
| Database | SQLite (`node:sqlite` built-in) |
| Auth | JWT + bcryptjs |
| Frontend | Vanilla JS + CSS3 |
| Animations | AOS + Swiper.js |
| Hosting | Vercel (Free) |

## 🚀 ლოკალურად გაშვება

```bash
# 1. დააკლონე
git clone https://github.com/TakoTechie1/georgia-premium-trips.git
cd georgia-premium-trips

# 2. დააინსტალირე
npm install

# 3. გაუშვი
node server.js
# ან Windows-ზე: start.bat

# 4. გახსენი
# http://localhost:3000
```

> **მოთხოვნა:** Node.js v22+

## 📁 სტრუქტურა

```
georgia-premium/
├── server.js          # Express სერვერი + API + DB
├── public/
│   ├── index.html     # მთავარი გვერდი
│   ├── admin.html     # ადმინ პანელი
│   ├── css/
│   │   ├── style.css  # მთავარი სტილი
│   │   └── admin.css  # ადმინის სტილი
│   └── js/
│       ├── main.js    # ანიმაციები, სლაიდები, ფორმები
│       ├── chatbot.js # ჩატბოტი
│       └── admin.js   # ადმინ ფუნქციონალი
├── vercel.json        # Vercel კონფიგი
└── start.bat          # Windows სწრაფი გაშვება
```

## 🌍 Deploy

პროექტი ავტომატურად deploy-ს Vercel-ზე GitHub-ის გამო.
ნებისმიერი `git push` → ავტომატური განახლება ლაივ საიტზე.

---

Built with ❤️ for Georgia Tourism
