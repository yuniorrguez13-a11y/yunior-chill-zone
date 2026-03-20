# Yuniors Chill Zone 🔴

**Yuniors Chill Zone** is an open-source real-time chat web app built for hanging out, dropping messages, and vibing with others online. It features a dark cyberpunk aesthetic with a matrix background, room-based chat powered by Supabase, user authentication, safe mode profanity filtering, profile pictures, and embedded tools like **cZEROde** — all in a single-file HTML setup.

---

## ✨ Features

- 🔐 Email-based sign up & login via Supabase Auth
- 💬 Real-time room-based messaging
- 🖼️ Profile picture support (via URL)
- 🛡️ Safe Mode — toggleable profanity filter
- ⚡ cZEROde — embedded tool launcher (in BETA)
- 🎵 Quick links to Music Room, Gaming Zone, Voice Chat & VideoZone
- 📱 Mobile-friendly responsive layout
- 🌐 Matrix rain background animation

---

## 🔓 Open Source

This project is fully open source. You are welcome to clone it, fork it, study the code, and use the layout or design as a starting point for your own project.

> **However, please read the usage terms below before doing so.**

---

## ⚖️ Usage Terms & Legal Notice

### ✅ You MAY:
- Use this project's code and layout as a **template or inspiration** for your own website
- Modify, redesign, and redistribute it under your own name and branding
- Share it and give credit (appreciated but not required)

### ❌ You MAY NOT:
- **Impersonate or replicate Yuniors Chill Zone** — you cannot copy the name, branding, logo, or overall identity and present it as your own version of this site
- Claim that your project **is** Yuniors Chill Zone or is officially affiliated with it
- Use this project to mislead users into thinking they are visiting the original site

> **⚠️ Impersonation of this project or its brand is a violation that may result in legal action. This is not a joke — if you copy this site's identity and pass it off as the original, you can and will be subject to a lawsuit.**

The distinction is simple: **use the code, not the identity.**

---

## 🎨 Personalize Your Own Version

Want to use this as a base for your own site? There's a built-in **visual site builder** — no code editing required.

Open `personalize.html` in your browser and walk through 6 steps:

1. **Identity** — Set your site name, tagline, browser tab title, and optional warning banner
2. **Colors** — Pick your accent color (red tones are blocked to protect the original branding — pink is allowed)
3. **Fonts** — Choose a display font for your heading and a body font for UI elements, from a curated list of Google Fonts
4. **Tools** — Add, remove, and customize the navigation links (emoji, label, URL or `.html` file)
5. **Options** — Toggle features on/off: matrix background, safe mode, room system, profile pictures, animations, and more
6. **Download** — Hit the button and get a ready-to-use `index.html` with everything baked in

> ⚠️ **Reminder:** You may use the layout freely — but **do not impersonate Yuniors Chill Zone**. Change the name, branding, and colors to make it your own. Copying the identity is not allowed and may result in legal action.

---

## 🛠️ Tech Stack

- **HTML / CSS / JavaScript** — vanilla, no frameworks
- **Supabase** — database, real-time subscriptions, and authentication
- **Google Fonts** — Rajdhani, Orbitron, Inter
- **Custom font** — SoulsideBetrayed (local)

---

## 🚀 Getting Started

1. Clone or download this repository
2. Set up a [Supabase](https://supabase.com) project and create a `messages` table with the following columns:
   - `id` (int8, primary key)
   - `text` (text)
   - `username` (text)
   - `pfp_url` (text)
   - `room_id` (text)
   - `user_id` (uuid, nullable)
3. Replace the `SUPABASE_URL` and `SUPABASE_KEY` values in `index.html` with your own
4. Add your `matrix.js` file (handles the canvas rain effect)
5. Open `index.html` in a browser or deploy to any static host

---

## 📁 File Structure

```
/
├── index.html        # Main app (HTML + CSS + JS all-in-one)
├── personalize.html  # Visual site builder — customize & download your own version
├── matrix.js         # Matrix rain canvas animation
├── favicon.png       # Site icon
├── fonts/
│   └── SoulsideBetrayed-3lazX.ttf
├── music.html
├── gaming.html
├── video.html
└── README.md
```

---

## 👤 Author

Made by **yuniorrguez13-a11y** — [GitHub](https://github.com/yuniorrguez13-a11y)

---

*Yuniors Chill Zone — Hang out · Drop a message · Vibe out*
