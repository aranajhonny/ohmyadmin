<div align="center">

# OhMyAdmin

![OhMyAdmin Logo](https://img.shields.io/badge/OhMyAdmin-Database%20Manager-blue?style=for-the-badge)
![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=for-the-badge&logo=go)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A modern and minimalist interface for managing MySQL databases**

</div>

---

## 🚀 Features

OhMyAdmin is a modern reimagining of phpMyAdmin, built with contemporary web technologies to deliver a superior user experience.

### ✨ Modern Interface
- **Minimalist design** inspired by the classic phpMyAdmin but with a contemporary touch
- **Responsive interface** that adapts to any screen size
- **Smooth animations** for a fluid experience
- **Dark/light theme** for visual comfort

### ⚡ Performance
- **Go backend** for maximum speed and efficiency
- **React frontend** with Vite for fast load times
- **SQL type-safe** using sqlc for secure queries
- **Optimized for large data volumes**

### 🛠️ Features
- **SQL Editor** with autocomplete and syntax highlighting (Monaco Editor)
- **Database Management** - Create, edit, delete databases
- **Table Management** - Structure, data, indexes, relationships
- **Import/Export** - Support for SQL, CSV, JSON, XML
- **Advanced Search** - Search across all databases and tables
- **User Management** - Privilege and permission control
- **Server Variables** - Configuration and optimization

---

## 📋 Prerequisites

- Docker and Docker Compose
- (Optional) Go 1.21+ for local backend development
- (Optional) Node.js 18+ and pnpm/npm for local frontend development

---

## 🏃 Quick Start

The quickest way to get started is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/yourusername/ohmyadmin.git
cd ohmyadmin

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:8081
# Backend API: http://localhost:8080
# MySQL: localhost:3307
```

**Default credentials:**
- Username: `root`
- Password: `root`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │    Vite     │  │  Shadcn/UI  │  │ TanStack    │    │
│  │   + TS      │  │ + Tailwind  │  │   Query     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP
┌─────────────────────────────────────────────────────────┐
│                    Backend (Go)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Chi Router │  │  sqlc       │  │   JWT       │    │
│  │  + Middleware│ │ type-safe   │  │   Auth      │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕ TCP
┌─────────────────────────────────────────────────────────┐
│                      MySQL 8.0                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
ohmyadmin/
├── backend/                 # Go API Server
│   ├── cmd/
│   │   └── server/
│   │       └── main.go     # Entry point
│   ├── internal/
│   │   ├── api/            # HTTP handlers
│   │   ├── auth/           # JWT middleware
│   │   ├── config/         # YAML config
│   │   ├── database/       # MySQL pool + sqlc
│   │   ├── export/         # Export plugins
│   │   ├── import/         # Import handlers
│   │   ├── models/         # Go structs
│   │   ├── router/         # Chi routes
│   │   └── services/       # Business logic
│   ├── go.mod
│   ├── sqlc.yaml
│   └── query.sql           # sqlc queries
│
├── frontend/               # React SPA
│   ├── src/
│   │   ├── components/     # Shadcn/UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── api/            # API client
│   │   ├── lib/            # Utilities
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── docker-compose.yml      # Orchestration
└── README.md
```

---

## 🔧 Local Development

### Backend (Go)

```bash
cd backend

# Install dependencies
go mod download

# Generate sqlc code
sqlc generate

# Run server
go run cmd/server/main.go
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Build for production
pnpm build
```

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check authentication status

### Databases
- `GET /api/databases` - List databases
- `POST /api/databases` - Create database
- `DELETE /api/databases/:name` - Drop database

### Tables
- `GET /api/databases/:db/tables` - List tables
- `POST /api/databases/:db/tables` - Create table
- `GET /api/tables/:db/:table` - Table info
- `GET /api/tables/:db/:table/columns` - List columns
- `GET /api/tables/:db/:table/data` - Browse data
- `POST /api/tables/:db/:table/data` - Insert row
- `PUT /api/tables/:db/:table/data` - Update row
- `DELETE /api/tables/:db/:table/data` - Delete rows

### SQL
- `POST /api/sql/execute` - Execute SQL
- `POST /api/sql/format` - Format SQL
- `GET /api/sql/auto-complete` - SQL autocomplete

### Import/Export
- `GET /api/export/:db/:table?` - Export (sql/csv/json/xml)
- `POST /api/import/:db/:table?` - Import SQL

### Server
- `GET /api/server/info` - Server information
- `GET /api/server/variables` - Server variables
- `GET /api/server/status` - Server status
- `GET /api/server/privileges` - User management

---

## 🎨 Tech Stack

### Backend
- **Go 1.21+** - Main language
- **Chi** - HTTP router
- **sqlc** - SQL type-safe
- **go-sql-driver/mysql** - MySQL driver
- **golang-jwt/jwt** - JWT authentication
- **slog** - Structured logging

### Frontend
- **React 18+** - UI framework
- **TypeScript 5+** - Static typing
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/UI** - UI components
- **TanStack Query** - Server state
- **Zustand** - Client state
- **React Router v6** - Routing
- **Monaco Editor** - SQL editor
- **React Hook Form** - Forms
- **Zod** - Validation

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **phpMyAdmin** - For the inspiration and decades of service to the community
- **Vercel** - For the design and web development best practices
- **Go and React communities** - For the incredible tools and libraries

---

## 📞 Contact

- **Project**: [OhMyAdmin](https://github.com/yourusername/ohmyadmin)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ohmyadmin/issues)

---

<div align="center">

**Made with ❤️ by the community**

[⬆ Back to top](#ohmyadmin)

</div>
