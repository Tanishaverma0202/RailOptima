# RailOptima                                                                                                     { Live Demo: https://railoptimadeploy.vercel.app/}
 
RailOptima is an advanced railway optimization platform built with a React/Vite frontend and a Node.js/Express backend.
It provides intelligent scheduling, conflict detection, real-time visualization, AI-based recommendations, and analytics for railway operations.

## Project Structure

- `src/` — frontend application source
- `backend/` — backend API server
- `public/` — static assets for frontend
- `dist/` — production build output
- `package.json` — root frontend dependencies and scripts
- `backend/package.json` — backend dependencies and scripts

### Environment

Use `.env.example` as a template for backend environment variables. Create a `.env` file inside `backend/` and configure:

- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `REDIS_URL`

## Notes

- The frontend currently uses a local mock service for UI development.
- The backend server includes a mock DB connector for demo mode.

## License

This project is released under the MIT License.
