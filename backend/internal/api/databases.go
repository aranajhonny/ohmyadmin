package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
	"github.com/aranajhonny/ohmyadmin/backend/internal/database"
)

type DatabaseHandler struct{}

func NewDatabaseHandler() *DatabaseHandler {
	return &DatabaseHandler{}
}

func (h *DatabaseHandler) List(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	databases, err := database.GetDatabases(r.Context(), db)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, databases)
}

func (h *DatabaseHandler) Create(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req struct {
		Name      string `json:"name"`
		Collation string `json:"collation,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Name == "" {
		writeError(w, http.StatusBadRequest, "database name is required")
		return
	}

	if err := database.CreateDatabase(r.Context(), db, req.Name, req.Collation); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "database created"})
}

func (h *DatabaseHandler) Drop(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "name")
	if dbName == "" {
		writeError(w, http.StatusBadRequest, "database name is required")
		return
	}

	if err := database.DropDatabase(r.Context(), db, dbName); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "database dropped"})
}
