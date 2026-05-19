package config

import (
	"os"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server   ServerConfig   `yaml:"server"`
	Database DatabaseConfig `yaml:"database"`
	Auth     AuthConfig     `yaml:"auth"`
	CORS     CORSConfig     `yaml:"cors"`
}

type ServerConfig struct {
	Host    string `yaml:"host"`
	Port    int    `yaml:"port"`
	LogLevel string `yaml:"log_level"`
}

type DatabaseConfig struct {
	Driver          string `yaml:"driver"`
	DSN             string `yaml:"dsn"`
	MaxOpenConns    int    `yaml:"max_open_conns"`
	MaxIdleConns    int    `yaml:"max_idle_conns"`
	ConnMaxLifetime int    `yaml:"conn_max_lifetime"`
	ConnMaxIdleTime int    `yaml:"conn_max_idle_time"`
}

type AuthConfig struct {
	JWTSecret     string `yaml:"jwt_secret"`
	JWTExpiration int    `yaml:"jwt_expiration"`
}

type CORSConfig struct {
	AllowedOrigins []string `yaml:"allowed_origins"`
	AllowedMethods []string `yaml:"allowed_methods"`
	AllowedHeaders []string `yaml:"allowed_headers"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	cfg := &Config{}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, err
	}

	setDefaults(cfg)
	return cfg, nil
}

func setDefaults(cfg *Config) {
	if cfg.Server.Host == "" {
		cfg.Server.Host = "0.0.0.0"
	}
	if cfg.Server.Port == 0 {
		cfg.Server.Port = 8080
	}
	if cfg.Server.LogLevel == "" {
		cfg.Server.LogLevel = "info"
	}
	if cfg.Database.MaxOpenConns == 0 {
		cfg.Database.MaxOpenConns = 10
	}
	if cfg.Database.MaxIdleConns == 0 {
		cfg.Database.MaxIdleConns = 5
	}
	if cfg.Auth.JWTExpiration == 0 {
		cfg.Auth.JWTExpiration = 86400
	}
	if cfg.CORS.AllowedOrigins == nil {
		cfg.CORS.AllowedOrigins = []string{"*"}
	}
	if cfg.CORS.AllowedMethods == nil {
		cfg.CORS.AllowedMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	}
	if cfg.CORS.AllowedHeaders == nil {
		cfg.CORS.AllowedHeaders = []string{"Content-Type", "Authorization"}
	}
}
