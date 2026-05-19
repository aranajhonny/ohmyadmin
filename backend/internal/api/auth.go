package api

import (
	"encoding/json"
	"net/http"

	"github.com/phpmyadmin/phpmyadmin/backend/internal/auth"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/models"
)

type AuthHandler struct {
	authService *auth.Service
}

func NewAuthHandler(authService *auth.Service) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Username == "" {
		writeError(w, http.StatusBadRequest, "username is required")
		return
	}

	resp, err := h.authService.Login(req.Server, req.Username, req.Password)
	if err != nil {
		writeError(w, http.StatusUnauthorized, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) Status(w http.ResponseWriter, r *http.Request) {
	claims := auth.GetClaims(r)
	if claims == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"authenticated": true,
		"user":          claims.Username,
		"mysql_host":    claims.MySQLHost,
		"mysql_port":    claims.MySQLPort,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "logged out"})
}
