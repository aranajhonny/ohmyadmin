package api

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/auth"
)

type ForeignKeysHandler struct{}

func NewForeignKeysHandler() *ForeignKeysHandler {
	return &ForeignKeysHandler{}
}

type ForeignKey struct {
	ConstraintName   string `json:"constraint_name"`
	ColumnName       string `json:"column_name"`
	ReferencedTable  string `json:"referenced_table"`
	ReferencedColumn string `json:"referenced_column"`
	OnDelete         string `json:"on_delete"`
	OnUpdate         string `json:"on_update"`
}

type AddForeignKeyRequest struct {
	ColumnName       string `json:"column_name"`
	ReferencedTable  string `json:"referenced_table"`
	ReferencedColumn string `json:"referenced_column"`
	OnDelete         string `json:"on_delete,omitempty"`
	OnUpdate         string `json:"on_update,omitempty"`
}

func (h *ForeignKeysHandler) RegisterRoutes(r chi.Router) {
	r.Route("/databases/{db}/tables/{table}/foreign-keys", func(r chi.Router) {
		r.Get("/", h.listForeignKeys)
		r.Post("/", h.addForeignKey)
		r.Delete("/{constraint}", h.dropForeignKey)
	})
}

func (h *ForeignKeysHandler) listForeignKeys(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	query := `
		SELECT 
			CONSTRAINT_NAME as constraint_name,
			COLUMN_NAME as column_name,
			REFERENCED_TABLE_NAME as referenced_table,
			REFERENCED_COLUMN_NAME as referenced_column,
			DELETE_RULE as on_delete,
			UPDATE_RULE as on_update
		FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
		ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION
	`

	rows, err := db.Query(query, dbName, tableName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var fks []ForeignKey
	for rows.Next() {
		var fk ForeignKey
		if err := rows.Scan(&fk.ConstraintName, &fk.ColumnName, &fk.ReferencedTable, &fk.ReferencedColumn, &fk.OnDelete, &fk.OnUpdate); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		fks = append(fks, fk)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fks)
}

func (h *ForeignKeysHandler) addForeignKey(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var req AddForeignKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.ColumnName == "" || req.ReferencedTable == "" || req.ReferencedColumn == "" {
		http.Error(w, "column_name, referenced_table, and referenced_column are required", http.StatusBadRequest)
		return
	}

	query := "ALTER TABLE `" + dbName + "`.`" + tableName + "` "
	query += "ADD CONSTRAINT `fk_" + tableName + "_" + req.ColumnName + "` "
	query += "FOREIGN KEY (`" + req.ColumnName + "`) "
	query += "REFERENCES `" + req.ReferencedTable + "` (`" + req.ReferencedColumn + "`)"

	if req.OnDelete != "" {
		query += " ON DELETE " + req.OnDelete
	}
	if req.OnUpdate != "" {
		query += " ON UPDATE " + req.OnUpdate
	}

	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Foreign key added successfully"})
}

func (h *ForeignKeysHandler) dropForeignKey(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")
	constraintName := chi.URLParam(r, "constraint")

	if constraintName == "" {
		http.Error(w, "constraint name is required", http.StatusBadRequest)
		return
	}

	// Check if foreign key exists
	var exists int
	err := db.QueryRow(`
		SELECT COUNT(*) 
		FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
	`, dbName, tableName, constraintName).Scan(&exists)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if exists == 0 {
		http.Error(w, "Foreign key not found", http.StatusNotFound)
		return
	}

	query := "ALTER TABLE `" + dbName + "`.`" + tableName + "` "
	query += "DROP FOREIGN KEY `" + constraintName + "`"

	if _, err := db.Exec(query); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Foreign key dropped successfully"})
}
