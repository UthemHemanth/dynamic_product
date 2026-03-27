# Dynamic Add Product (React + Node + Postgres)

Implements a **category-driven product system**:

- Admin can define **categories** and their **dynamic attributes**
- Admin can **add products**; the form fields render from backend metadata (no hardcoded per-category UI)
- Product details page renders dynamically from stored attribute values
- Search uses **backend-driven filtering + facets** from Postgres

## Tech

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- DB: Postgres (Docker)
- Data access: raw SQL via `pg` (no ORM)

## Quick start

### 1) Start Postgres

```bash
docker compose up -d
```

### 2) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:4000`.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## What to try

- Open the Admin UI
  - Create a category (e.g. **Mobile**) and add attributes (RAM, Processor, Storage, Color)
  - Create another category (e.g. **Bangles**) with different attributes
  - Add products; notice fields change based on category
- Use the Search page; filters/facets are fetched from backend for the selected category

## Notes on scalability / SOLID / DRY

- Category/attribute metadata lives in DB and drives both UI and validation.
- Attribute storage uses a **typed value model** (text/number/boolean/select) for efficient filtering.
- Backend is layered: **routes → controllers → services → repositories**, keeping responsibilities separated.

