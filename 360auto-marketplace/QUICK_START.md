# ⚡ Quick Start Guide

Get up and running in **5 minutes**

---

## 1️⃣ Clone & Install

```bash
cd 360auto-marketplace

# Run setup script
./setup.sh

# Or install manually
cd backend && npm install
cd ../mobile && npm install  
cd ../shared && npm install
```

---

## 2️⃣ Configure Environment

### Backend `.env`

```bash
cd backend
cp .env.example .env  # Edit with your keys
```

### Mobile `.env`

```bash
cd mobile
cp .env.example .env  # Edit with your keys
```

---

## 3️⃣ Start Development

### Terminal 1 - Backend

```bash
cd backend
npm run dev

# ✅ Server running on http://localhost:3001
```

### Terminal 2 - Mobile

```bash
cd mobile
npm start

# ✅ Expo DevTools open
# 📱 Scan QR code with Expo Go app
```

---

## 4️⃣ Test It Works

- **Backend health:** <http://localhost:3001/health>
- **Mobile app:** Open in Expo Go app

---

## 🎯 That's It

Ready to build! 🚀

For detailed setup, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)
