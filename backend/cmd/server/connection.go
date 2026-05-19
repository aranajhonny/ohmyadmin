package main

import (
	"github.com/phpmyadmin/phpmyadmin/backend/internal/config"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/database"
)

func NewConnectionManager(cfg *config.Config) *database.Manager {
	return database.NewManager(
		cfg.Database.DSN,
		cfg.Database.MaxOpenConns,
		cfg.Database.MaxIdleConns,
	)
}
