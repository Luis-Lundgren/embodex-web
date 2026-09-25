# Embodex Web — Motion Exchange & Teleop Studio 🌐🦾

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black)](https://threejs.org/)
[![Backend](https://img.shields.io/badge/Embodex_Teleop-Backend-orange)](https://github.com/Luis-Lundgren/embodex-teleop)

**Embodex Web** is the open-source frontend and platform hub for the **Embodex** ecosystem. It provides an embodied dataset exchange, interactive 3D digital-twin trajectory visualizer, episode review studio, and live WebXR robot teleoperation cockpit.

---

## ✨ Features

- **Motion Exchange**: Search, inspect, and download open-source robot manipulation datasets and trajectories.
- **3D Trajectory Viewer**: Interactive WebGL playback powered by Three.js and React Three Fiber with 6DoF end-effector trails and joint interpolation.
- **Episode Review Studio**: Filter recorded sessions, inspect success metrics, and annotate robotic episodes.
- **Live Teleoperation Cockpit**: Real-time WebSocket connection to the [`embodex-teleop`](https://github.com/Luis-Lundgren/embodex-teleop) backend for live robot monitoring and control.
- **WebXR Ready**: Direct in-browser VR support for Meta Quest and Apple Vision Pro.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **3D Graphics**: Three.js, React Three Fiber, Drei
- **Styling**: Tailwind CSS
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Google OAuth & Credentials)
- **Robot Backend Integration**: WebSocket & REST to `embodex-teleop`

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase instance)
- A running [`embodex-teleop`](https://github.com/Luis-Lundgren/embodex-teleop) instance (optional, for live teleoperation)

### 2. Install Dependencies

```bash
git clone https://github.com/Luis-Lundgren/embodex-web.git
cd embodex-web
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your database credentials and backend URLs:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/embodex?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/embodex?schema=public"
NEXTAUTH_SECRET="generate-with-openssl-rand-hex-32"
NEXTAUTH_URL="http://localhost:3000"

# Embodex Teleop Backend URL (preferred)
NEXT_PUBLIC_EMBODEX_TELEOP_HTTP_URL="http://localhost:8500"
NEXT_PUBLIC_EMBODEX_TELEOP_WS_URL="ws://localhost:8500/ws"
# Fallback (deprecated in v0.2, planned removal in a future release):
# NEXT_PUBLIC_TELEGRIP_HTTP_URL="http://localhost:8500"
# NEXT_PUBLIC_TELEGRIP_WS_URL="ws://localhost:8500"
```

### 4. Push Database Schema

```bash
npx prisma db push
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

Build and run with Docker:

```bash
docker build -t embodex-web .
docker run -p 3000:3000 --env-file .env embodex-web
```

---

## 🔗 Related Repositories

- **[Embodex Teleop](https://github.com/Luis-Lundgren/embodex-teleop)**: The robot teleoperation engine, digital twin simulator, and episode recorder.
- **[TeleGrip Submodule](https://github.com/Luis-Lundgren/telegrip)**: Upstream-compatible fork of TeleGrip.

---

## 📜 License & Attribution

Embodex Web is licensed under the [Apache License 2.0](LICENSE).
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for details on third-party libraries.
