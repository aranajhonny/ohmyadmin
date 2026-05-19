package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/auth"
)

type ViewsHandler struct{}

func NewViewsHandler() *ViewsHandler {
	return &ViewsHandler{}
}

type ViewInfo struct {
	Name        string `json:"name"`
	Database    string `json:"database"`
	Definition  string `json:"definition"`
	CheckOption string `json:"check_option"`
	IsUpdatable string `json:"is_updatable"`
}

type CreateViewRequest struct {
	Name        string `json:"name"`
	Definition  string `json:"definition"`
	CheckOption string `json:"check_option,omitempty"`
}

type AlterViewRequest struct {
	Definition  string `json:"definition"`
	CheckOption string `json:"check_option,omitempty"`
}

func (h *ViewsHandler) RegisterRoutes(r chi.Router) {
	r.Route("/databases/{db}/views", func(r chi.Router) {
		r.Get("/", h.listViews)
		r.Post("/", h.createView)
		r.Route("/{view}", func(r chi.Router) {
			r.Get("/", h.getView)
			r.Put("/", h.alterView)
			r.Delete("/", h.dropView)
		})
	})
}

func (h *ViewsHandler) listViews(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")

	query := `
		SELECT 
			TABLE_NAME as name,
			VIEW_DEFINITION as definition,
			CHECK_OPTION as check_option,
			IS_UPDATABLE as is_updatable
		FROM INFORMATION_SCHEMA.VIEWS
		WHERE TABLE_SCHEMA = ?
		ORDER BY TABLE_NAME
	`

	rows, err := db.Query(query, dbName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var views []ViewInfo
	for rows.Next() {
		var v ViewInfo
		if err := rows.Scan(&v.Name, &v.Definition, &v.CheckOption, &v.IsUpdatable); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		v.Database = dbName
		views = append(views, v)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(views)
}

func (h *ViewsHandler) getView(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	viewName := chi.URLParam(r, "view")

	query := `
		SELECT 
			TABLE_NAME as name,
			VIEW_DEFINITION as definition,
			CHECK_OPTION as check_option,
			IS_UPDATABLE as is_updatable
		FROM INFORMATION_SCHEMA.VIEWS
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
	`

	var v ViewInfo
	err := db.QueryRow(query, dbName, viewName).Scan(&v.Name, &v.Definition, &v.CheckOption, &v.IsUpdatable)
	if err == sql.ErrNoRows {
		http.Error(w, "View not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	v.Database = dbName

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func (h *ViewsHandler) createView(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")

	var req CreateViewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Definition == "" {
		http.Error(w, "Name and definition are required", http.StatusBadRequest)
		return
	}

	query := "CREATE VIEW "
	if req.CheckOption != "" {
		query += req.CheckOption + " "
	}
	query += "`" + dbName + "`.`" + req.Name + "` AS " + req.Definition

	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "View created successfully"})
}

func (h *ViewsHandler) alterView(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	viewName := chi.URLParam(r, "view")

	var req AlterViewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Definition == "" {
		http.Error(w, "Definition is required", http.StatusBadRequest)
		return
	}

	query := "ALTER VIEW "
	if req.CheckOption != "" {
		query += req.CheckOption + " "
	}
	query += "`" + dbName + "`.`" + viewName + "` AS " + req.Definition

	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "View altered successfully"})
}

func (h *ViewsHandler) dropView(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	viewName := chi.URLParam(r, "view")

	// Check if view exists
	var exists int
	err := db.QueryRow("SELECT COUNT(*) FROM INFORMATION_SCHEMA.VIEWS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?", dbName, viewName).Scan(&exists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if exists == 0 {
		http.Error(w, "View not found", http.StatusNotFound)
		return
	}

	query := "DROP VIEW `" + dbName + "`.`" + viewName + "`"
	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "View dropped successfully"})
}
