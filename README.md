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

## 🤝 Contributing

Contributions are welcome!

---


## 🙏 Acknowledgments

- **phpMyAdmin** - For the inspiration and decades of service to the community
