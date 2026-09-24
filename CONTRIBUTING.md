# Contributing to Embodex Web

Thank you for your interest in contributing to Embodex Web and the Motion Exchange!

---

## Code of Conduct

Please adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all project interactions.

---

## Development Workflow

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/Luis-Lundgren/embodex-web.git
   cd embodex-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment:
   ```bash
   cp .env.example .env
   ```

4. Push the Prisma database schema:
   ```bash
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Verify that TypeScript compilation and build pass:
   ```bash
   npm run build
   ```

---

## Pull Request Guidelines

- Ensure your code adheres to standard React and TypeScript conventions.
- Never commit `.env` or sensitive API keys.
- Keep commits clear and formatted according to Conventional Commits (`feat:`, `fix:`, `docs:`, `ui:`).
- Submit Pull Requests against the `main` branch.
