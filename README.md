# 📤 FileDrop

**Instant, temporary file sharing — no account required.**

> Share up to 10 files at once with a single link or QR code. Files auto-expire for privacy.

🔗 **Live Demo:** [Coming Soon](#)

---

## ✨ Features

- **Multi-file Upload** — Share up to 10 files (200MB total) in one go
- **Zero Authentication** — No sign-up, no login, just upload and share
- **QR Code Sharing** — Scan to download on any device
- **Auto-Expiry** — Files automatically delete after 10, 30, or 60 minutes
- **Bulk Download** — Download all files as a ZIP or individually
- **Mobile-First** — Works seamlessly on phones, tablets, and desktops
- **Dark Mode** — Automatic theme switching

---

## 🛠️ Tech Stack

| Category     | Technology                                     |
| ------------ | ---------------------------------------------- |
| Framework    | [Next.js 16](https://nextjs.org/) (App Router) |
| Styling      | [Tailwind CSS 4](https://tailwindcss.com/)     |
| Database     | [Convex](https://convex.dev/)                  |
| File Storage | [UploadThing](https://uploadthing.com/)        |
| Deployment   | [Vercel](https://vercel.com/)                  |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/file-drop.git
   cd file-drop
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_CONVEX_URL=your_convex_url
   UPLOADTHING_TOKEN=your_uploadthing_token
   CRON_SECRET=your_cron_secret
   BUNDLE_AUTH_SERVER_TOKEN=your_random_secret_token
   ```

   > **Password Protection:** See [PASSWORD_PROTECTION_SETUP.md](PASSWORD_PROTECTION_SETUP.md) for details on `BUNDLE_AUTH_SERVER_TOKEN`.

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Start Convex (in a separate terminal)**
   ```bash
   npx convex dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## 📁 Project Structure

```
file-drop/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (upload, download, cleanup)
│   ├── share/[id]/        # Share page with QR code
│   └── download/[id]/     # Download page
├── components/            # React components
├── convex/                # Convex backend (schema, mutations, queries)
├── lib/                   # Utilities (UploadThing config)
└── public/                # Static assets
```

---

## 🔒 How It Works

1. **Upload** — Drag & drop or select up to 10 files
2. **Share** — Get a unique link and QR code
3. **Download** — Recipients can download individually or as a ZIP
4. **Auto-Delete** — Files are automatically purged after expiry

---

## 📜 License

MIT License — feel free to use this project for personal or commercial purposes.

---

## 👤 Author

Made with ❤️ by [Benedict](https://benedictumeozor.vercel.app/)
