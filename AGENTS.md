# OhMyAdmin Migration: PHP → Go + React

mandatory: use docker not local cli of npm or golang

## Architecture
- `backend/` - Go API server (chi router, sqlc, JWT auth)
- `frontend/` - React SPA (Vite, Shadcn/UI, TanStack Table, Monaco Editor, TanStack Query)
- `docker-compose.yml` - Orchestrates Go backend + React frontend + MySQL

## Backend (Go)
- **Router**: `chi`
- **MySQL**: `go-sql-driver/mysql` + `sqlc` (type-safe queries)
- **Auth**: JWT with HTTP-only cookies
- **Config**: YAML
- **Logging**: `slog`

## Frontend (React)
- **Build**: Vite + TypeScript
- **UI**: Shadcn/UI + Tailwind CSS
- **State/Server cache**: TanStack Query + Zustand
- **Tables**: TanStack Table (sort, filter, paginate, inline edit)
- **SQL Editor**: Monaco Editor
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6