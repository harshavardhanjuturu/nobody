# Nobody — Campus Student Portal & Peer Delivery Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nobody--portal.vercel.app-004CBB?style=for-the-badge&logo=vercel)](https://nobody-portal.vercel.app)

> **Live Production URL**: [https://nobody-portal.vercel.app](https://nobody-portal.vercel.app)

---

## 🌟 Key Features

- 🍔 **Food & Dining Counter Orders**: Browse campus canteen menus, customize carts, and order for counter pickup.
- 🚴 **Peer-to-Peer Delivery Network**: Request peer delivery to your hostel room with 4-digit Handshake PIN security.
- 📡 **Real-Time Multi-Device Tracking**: Live cross-device status sync (`accepted` ➔ `picked_up` ➔ `delivered`) and GPS coordinates.
- 🛡️ **Trust & Safety**: Integrated dispute reporting and mutual ratings (Buyer <-> Deliverer).
- 💬 **Campus Social & Messaging**: Peer-to-peer real-time chat, campus social feed, and community groups.
- 💼 **Freelance & Skills Marketplace**: Discover student freelancers and campus skill-sharing opportunities.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org)
- **Database & ORM**: SQLite / Prisma ORM
- **Styling**: Vanilla CSS & TailwindCSS (Dark/Light mode support)
- **Deployment**: [Vercel](https://vercel.com)

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/harshavardhanjuturu/nobody.git

# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application locally.
