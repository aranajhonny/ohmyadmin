package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/auth"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/database"
)

type ExportHandler struct{}

func NewExportHandler() *ExportHandler {
	return &ExportHandler{}
}

func (h *ExportHandler) Export(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")
	format := database.ExportFormat(r.URL.Query().Get("format"))
	if format == "" {
		format = database.FormatSQL
	}

	var content string
	var err error

	if tableName != "" {
		content, err = database.ExportTable(r.Context(), db, dbName, tableName, format)
	} else {
		content, err = database.ExportDatabase(r.Context(), db, dbName, format)
	}

	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var contentType string
	var extension string
	switch format {
	case database.FormatSQL:
		contentType = "application/sql"
		extension = "sql"
	case database.FormatCSV:
		contentType = "text/csv"
		extension = "csv"
	case database.FormatJSON:
		contentType = "application/json"
		extension = "json"
	case database.FormatXML:
		contentType = "application/xml"
		extension = "xml"
	default:
		contentType = "text/plain"
		extension = "txt"
	}

	w.Header().Set("Content-Type", contentType)
	if tableName != "" {
		w.Header().Set("Content-Disposition", "attachment; filename="+tableName+"."+extension)
	} else {
		w.Header().Set("Content-Disposition", "attachment; filename="+dbName+"."+extension)
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(content))
}
