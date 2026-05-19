package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
	"github.com/aranajhonny/ohmyadmin/backend/internal/database"
)

type ImportHandler struct{}

func NewImportHandler() *ImportHandler {
	return &ImportHandler{}
}

func (h *ImportHandler) Import(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")

	// Check if request is multipart/form-data (file upload) or JSON
	contentType := r.Header.Get("Content-Type")
	
	var sqlContent string
	
	if strings.HasPrefix(contentType, "multipart/form-data") {
		// Handle file upload
		err := r.ParseMultipartForm(32 << 20) // 32MB max
		if err != nil {
			writeError(w, http.StatusBadRequest, "failed to parse form data")
			return
		}

		file, _, err := r.FormFile("sql_file")
		if err != nil {
			writeError(w, http.StatusBadRequest, "sql_file is required")
			return
		}
		defer file.Close()

		bytes, err := io.ReadAll(file)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to read file")
			return
		}
		sqlContent = string(bytes)
	} else {
		// Handle JSON body
		var req struct {
			SQLContent string `json:"sql_content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			writeError(w, http.StatusBadRequest, "invalid request body")
			return
		}

		if req.SQLContent == "" {
			writeError(w, http.StatusBadRequest, "sql_content is required")
			return
		}
		sqlContent = req.SQLContent
	}

	if err := database.ImportSQL(r.Context(), db, dbName, sqlContent); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "import successful"})
}

func (h *ImportHandler) ImportDatabase(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req struct {
		DatabaseName string `json:"database_name"`
		SQLContent   string `json:"sql_content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.DatabaseName == "" {
		writeError(w, http.StatusBadRequest, "database_name is required")
		return
	}

	if req.SQLContent == "" {
		writeError(w, http.StatusBadRequest, "sql_content is required")
		return
	}

	// Create the database first
	createDBQuery := fmt.Sprintf("CREATE DATABASE IF NOT EXISTS `%s`", req.DatabaseName)
	if _, err := db.Exec(createDBQuery); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Use the database
	useDBQuery := fmt.Sprintf("USE `%s`", req.DatabaseName)
	if _, err := db.Exec(useDBQuery); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Import the SQL content
	if err := database.ImportSQL(r.Context(), db, req.DatabaseName, req.SQLContent); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "database imported successfully"})
}
