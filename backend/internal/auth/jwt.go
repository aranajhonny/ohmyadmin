package auth

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/database"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/models"
)

type contextKey string

const UserContextKey contextKey = "user"

type Claims struct {
	jwt.RegisteredClaims
	ServerKey   string `json:"server_key"`
	Username    string `json:"username"`
	Host        string `json:"host"`
	MySQLHost   string `json:"mysql_host"`
	MySQLPort   string `json:"mysql_port"`
}

type Service struct {
	jwtSecret     string
	jwtExpiration int
	dbManager     *database.Manager
}

func NewService(jwtSecret string, jwtExpiration int, dbManager *database.Manager) *Service {
	return &Service{
		jwtSecret:     jwtSecret,
		jwtExpiration: jwtExpiration,
		dbManager:     dbManager,
	}
}

func (s *Service) Login(serverAddr, username, password string) (*models.LoginResponse, error) {
	// For Docker environment, always use the db service
	host := "db"
	port := "3306"
	
	key := fmt.Sprintf("%s:%s", host, username)

	dsn := database.BuildDSN(host, port, username, password, "mysql")
	db, err := s.dbManager.Connect(key, dsn)
	if err != nil {
		return nil, fmt.Errorf("authentication failed: %w", err)
	}

	var mysqlUser string
	row := db.QueryRow("SELECT CURRENT_USER()")
	if err := row.Scan(&mysqlUser); err != nil {
		return nil, fmt.Errorf("failed to get current user: %w", err)
	}

	now := time.Now()
	claims := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(s.jwtExpiration) * time.Second)),
			IssuedAt:  jwt.NewNumericDate(now),
			Issuer:    "phpmyadmin",
		},
		ServerKey: key,
		Username:  mysqlUser,
		MySQLHost: host,
		MySQLPort: port,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	return &models.LoginResponse{
		Token: tokenString,
		User:  mysqlUser,
	}, nil
}

func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

func (s *Service) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"missing authorization header"}`, http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			http.Error(w, `{"error":"invalid authorization format"}`, http.StatusUnauthorized)
			return
		}

		claims, err := s.ValidateToken(parts[1])
		if err != nil {
			http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusUnauthorized)
			return
		}

		db, err := s.dbManager.Get(claims.ServerKey)
		if err != nil {
			http.Error(w, `{"error":"database connection not found, please login again"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		ctx = context.WithValue(ctx, "db", db)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func GetDB(r *http.Request) *sql.DB {
	db, ok := r.Context().Value("db").(*sql.DB)
	if !ok {
		return nil
	}
	return db
}

func GetClaims(r *http.Request) *Claims {
	claims, ok := r.Context().Value(UserContextKey).(*Claims)
	if !ok {
		return nil
	}
	return claims
}

func parseServerAddr(addr string) (host, port string) {
	host = "127.0.0.1"
	port = "3306"

	if addr == "" {
		return
	}

	if strings.Contains(addr, ":") {
		parts := strings.SplitN(addr, ":", 2)
		host = parts[0]
		if len(parts) > 1 {
			port = parts[1]
		}
	} else {
		host = addr
	}

	if host == "localhost" {
		host = "127.0.0.1"
	}

	return
}
