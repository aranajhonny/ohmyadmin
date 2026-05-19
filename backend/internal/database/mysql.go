package database

import (
	"database/sql"
	"fmt"
	"log/slog"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

type Manager struct {
	mu       sync.RWMutex
	conns    map[string]*sql.DB
	dsn      string
	maxOpen  int
	maxIdle  int
}

func NewManager(dsn string, maxOpen, maxIdle int) *Manager {
	return &Manager{
		conns:   make(map[string]*sql.DB),
		dsn:     dsn,
		maxOpen: maxOpen,
		maxIdle: maxIdle,
	}
}

func (m *Manager) Connect(key string, dsn string) (*sql.DB, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if db, ok := m.conns[key]; ok {
		return db, nil
	}

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open connection %s: %w", key, err)
	}

	db.SetMaxOpenConns(m.maxOpen)
	db.SetMaxIdleConns(m.maxIdle)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("failed to ping %s: %w", key, err)
	}

	m.conns[key] = db
	slog.Info("connected to MySQL", "key", key)
	return db, nil
}

func (m *Manager) Get(key string) (*sql.DB, error) {
	m.mu.RLock()
	db, ok := m.conns[key]
	m.mu.RUnlock()

	if !ok {
		return nil, fmt.Errorf("no connection found for key: %s", key)
	}
	return db, nil
}

func (m *Manager) Disconnect(key string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if db, ok := m.conns[key]; ok {
		delete(m.conns, key)
		return db.Close()
	}
	return nil
}

func (m *Manager) DisconnectAll() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for key, db := range m.conns {
		db.Close()
		delete(m.conns, key)
	}
}

func BuildDSN(host, port, user, pass, dbName string) string {
	if port == "" {
		port = "3306"
	}
	tls := ""
	net := "tcp"
	if host == "" {
		host = "127.0.0.1"
	}
	return fmt.Sprintf("%s:%s@%s(%s:%s)/%s?parseTime=true&charset=utf8mb4%s",
		user, pass, net, host, port, dbName, tls)
}
