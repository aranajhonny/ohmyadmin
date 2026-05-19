package main

import (
	"github.com/aranajhonny/ohmyadmin/backend/internal/config"
	"github.com/aranajhonny/ohmyadmin/backend/internal/database"
)

func NewConnectionManager(cfg *config.Config) *database.Manager {
	return database.NewManager(
		cfg.Database.DSN,
		cfg.Database.MaxOpenConns,
		cfg.Database.MaxIdleConns,
	)
}
