package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
)

type TriggersHandler struct {
	db *sql.DB
}

func NewTriggersHandler() *TriggersHandler {
	return &TriggersHandler{}
}

func (h *TriggersHandler) List(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := r.URL.Query().Get("db")
	tableName := r.URL.Query().Get("table")

	var query string
	var args []interface{}

	if tableName != "" {
		query = `
			SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING, ACTION_STATEMENT
			FROM INFORMATION_SCHEMA.TRIGGERS
			WHERE TRIGGER_SCHEMA = ? AND EVENT_OBJECT_TABLE = ?
			ORDER BY TRIGGER_NAME
		`
		args = []interface{}{dbName, tableName}
	} else {
		query = `
			SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING, ACTION_STATEMENT
			FROM INFORMATION_SCHEMA.TRIGGERS
			WHERE TRIGGER_SCHEMA = ?
			ORDER BY TRIGGER_NAME
		`
		args = []interface{}{dbName}
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	triggers := []map[string]interface{}{}
	for rows.Next() {
		var triggerName, eventManipulation, eventObjectTable, actionTiming, actionStatement string
		if err := rows.Scan(&triggerName, &eventManipulation, &eventObjectTable, &actionTiming, &actionStatement); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		triggers = append(triggers, map[string]interface{}{
			"name":        triggerName,
			"event":       eventManipulation,
			"table":       eventObjectTable,
			"timing":      actionTiming,
			"statement":   actionStatement,
		})
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"triggers": triggers})
}

func (h *TriggersHandler) Create(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req struct {
		Database  string `json:"database"`
		Table     string `json:"table"`
		Name      string `json:"name"`
		Event     string `json:"event"` // INSERT, UPDATE, DELETE
		Timing    string `json:"timing"` // BEFORE, AFTER
		Statement string `json:"statement"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Database == "" || req.Table == "" || req.Name == "" || req.Event == "" || req.Timing == "" || req.Statement == "" {
		writeError(w, http.StatusBadRequest, "all fields are required")
		return
	}

	query := fmt.Sprintf("USE `%s`", req.Database)
	if _, err := db.Exec(query); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	createTriggerSQL := fmt.Sprintf(`
		CREATE TRIGGER %s
		%s %s
		ON %s
		FOR EACH ROW
		%s
	`, req.Name, req.Timing, req.Event, req.Table, req.Statement)

	if _, err := db.Exec(createTriggerSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Trigger created successfully"})
}

func (h *TriggersHandler) Drop(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := r.URL.Query().Get("db")
	triggerName := r.URL.Query().Get("trigger")

	if dbName == "" || triggerName == "" {
		writeError(w, http.StatusBadRequest, "database and trigger name are required")
		return
	}

	query := fmt.Sprintf("USE `%s`", dbName)
	if _, err := db.Exec(query); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	dropSQL := fmt.Sprintf("DROP TRIGGER IF EXISTS `%s`", triggerName)
	if _, err := db.Exec(dropSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Trigger dropped successfully"})
}
