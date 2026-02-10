# SO-100 Motion Exchange MVP

The premium marketplace for high-fidelity SO-100 robot arm trajectories.

## Features
- **Dataset Browser**: Explore free and premium datasets.
- **3D Visualization**: Interactive digital twin viewer with playback controls.
- **Premium Requests**: Submit valid datasets for review or request custom data.
- **Admin Dashboard**: Review submissions.

## Tech Stack
- **Frontend**: Next.js 14, React, TailwindCSS, Three.js, React Three Fiber.
- **Database**: SQLite (via Prisma).
- **Ingestion**: Python script for HuggingFace/LeRobot datasets.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   ```bash
   npx prisma db push
   ```
   *Note: If running in a mixed WSL/Windows environment and `npx` fails, try using `node.exe node_modules/prisma/build/index.js db push`*

3. **Assets Setup**
   The robot assets are symlinked in `public/assets`. If using Windows Node, you may need to copy them physically:
   ```bash
   rm public/assets/robots
   cp -r ./public/assets/robots public/assets/
   ```

4. **Ingest Data**
   You can ingest existing LeRobot datasets.
   ```bash
   python3 scripts/ingest_dataset.py --source /path/to/dataset
   ```

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deployment (Docker)

1. **Build Container**
   ```bash
   docker build -t motion-exchange .
   ```

2. **Run**
   ```bash
   docker run -p 3000:3000 -v $(pwd)/datasets:/app/datasets -v $(pwd)/dev.db:/app/dev.db motion-exchange
   ```

## Authentication Setup (Google OAuth)

This project uses Google Authentication. To set it up:

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project.
   - Navigate to **APIs & Services > Credentials**.
   - Create **OAuth client ID** (Application type: Web application).
   - Add **Authorized redirect URIs**:
     - `https://localhost:3000/api/auth/callback/google`

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env` (or update existing `.env`).
   - Fill in the following variables:
     ```env
     GOOGLE_CLIENT_ID=your_client_id_here
     GOOGLE_CLIENT_SECRET=your_client_secret_here
     NEXTAUTH_SECRET=your_random_secret_here
     NEXTAUTH_URL=https://localhost:3000
     ```
   - To generate a `NEXTAUTH_SECRET`, you can run: `openssl rand -hex 32`

### TeleGrip Backend (Railway)
If you are connecting to a remote TeleGrip backend (e.g., on Railway):
```env
NEXT_PUBLIC_TELEGRIP_WS_URL=wss://your-backend.up.railway.app/ws
NEXT_PUBLIC_TELEGRIP_HTTP_URL=https://your-backend.up.railway.app
```
*Note: The WebSocket URL must include the `/ws` path, and production URLs should not specify a port.*

3. **Database Migration**
   - Ensure you've run the latest migrations to include auth tables:
     ```bash
     npx prisma migrate dev
     ```

## Development with HTTPS

Google OAuth requires HTTPS even on localhost. Run the dev server with:
```bash
npm run dev -- --experimental-https
```

## Project Structure
- `app/`: Next.js App Router pages and API routes.
- `components/`: React components (UI + 3D).
- `datasets/`: Local storage for dataset JSONs and manifest.
- `lib/`: Shared utilities (Prisma, Auth).
- `scripts/`: Python utility scripts.
- `prisma/`: Database schema.
