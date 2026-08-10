# RailOptima

RailOptima is an advanced railway optimization platform built with a React/Vite frontend and a Node.js/Express backend.
It provides intelligent scheduling, conflict detection, real-time visualization, AI-based recommendations, and analytics for railway operations.

## Project Structure

- `src/` — frontend application source
- `backend/` — backend API server
- `public/` — static assets for frontend
- `dist/` — production build output
- `package.json` — root frontend dependencies and scripts
- `backend/package.json` — backend dependencies and scripts

## Quick Start

### Frontend

Install dependencies and start the frontend:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:5173/
```

### Backend

Install backend dependencies and start the server:

```bash
cd backend
npm install
npm run dev
```

By default, the backend runs on:

```text
http://localhost:5000/
```

### Environment

Use `.env.example` as a template for backend environment variables. Create a `.env` file inside `backend/` and configure:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_URL`

## Useful Commands

### Frontend

- `npm start` — run frontend dev server
- `npm run build` — create production build
- `npm run preview` — preview production build
- `npm run lint` — run lint checks

### Backend

- `cd backend && npm run dev` — run backend with nodemon
- `cd backend && npm start` — run backend normally
- `cd backend && npm run seed` — seed demo data

## Notes

- The frontend currently uses a local mock service for UI development.
- The backend server includes a mock DB connector for demo mode.
- If you experience a blank screen after simulation launch, rebuild and restart the frontend.

## License

This project is released under the MIT License.
