package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
)

type UsersHandler struct{}

func NewUsersHandler() *UsersHandler {
	return &UsersHandler{}
}

type User struct {
	Host     string `json:"host"`
	User     string `json:"user"`
	Password string `json:"password,omitempty"`
}

type CreateUserRequest struct {
	User     string `json:"user"`
	Host     string `json:"host"`
	Password string `json:"password"`
}

type UpdateUserRequest struct {
	User     string `json:"user"`
	Host     string `json:"host"`
	Password string `json:"password,omitempty"`
}

func (h *UsersHandler) RegisterRoutes(r chi.Router) {
	r.Route("/server/users", func(r chi.Router) {
		r.Get("/", h.listUsers)
		r.Post("/", h.createUser)
		r.Delete("/{user}/{host}", h.deleteUser)
		r.Put("/", h.updateUser)
	})
}

func (h *UsersHandler) listUsers(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	query := `
		SELECT host, user 
		FROM mysql.user 
		WHERE user NOT IN ('mysql.sys', 'mysql.session', 'mysql.infoschema')
		ORDER BY user, host
	`

	rows, err := db.Query(query)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.Host, &user.User); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *UsersHandler) createUser(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.User == "" || req.Host == "" || req.Password == "" {
		http.Error(w, "user, host, and password are required", http.StatusBadRequest)
		return
	}

	query := "CREATE USER '" + req.User + "'@'" + req.Host + "' IDENTIFIED BY '" + req.Password + "'"

	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func (h *UsersHandler) updateUser(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.User == "" || req.Host == "" {
		http.Error(w, "user and host are required", http.StatusBadRequest)
		return
	}

	var query string
	if req.Password != "" {
		query = "ALTER USER '" + req.User + "'@'" + req.Host + "' IDENTIFIED BY '" + req.Password + "'"
	} else {
		http.Error(w, "password is required for update", http.StatusBadRequest)
		return
	}

	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User updated successfully"})
}

func (h *UsersHandler) deleteUser(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	user := chi.URLParam(r, "user")
	host := chi.URLParam(r, "host")

	if user == "" || host == "" {
		http.Error(w, "user and host are required", http.StatusBadRequest)
		return
	}

	// Prevent deletion of current user
	currentUser := r.Context().Value("username")
	if currentUser == user && host == "%" {
		http.Error(w, "cannot delete current user", http.StatusBadRequest)
		return
	}

	query := "DROP USER '" + user + "'@'" + host + "'"

	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}
