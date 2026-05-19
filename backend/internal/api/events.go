package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/phpmyadmin/phpmyadmin/backend/internal/auth"
)

type EventsHandler struct{}

func NewEventsHandler() *EventsHandler {
	return &EventsHandler{}
}

func (h *EventsHandler) List(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := r.URL.Query().Get("db")

	query := `
		SELECT EVENT_NAME, EVENT_TYPE, EXECUTE_AT, INTERVAL_VALUE, INTERVAL_FIELD, STATUS, ON_COMPLETION
		FROM INFORMATION_SCHEMA.EVENTS
		WHERE EVENT_SCHEMA = ?
		ORDER BY EVENT_NAME
	`

	rows, err := db.Query(query, dbName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	events := []map[string]interface{}{}
	for rows.Next() {
		var eventName, eventType, onCompletion, status sql.NullString
		var executeAt, intervalField sql.NullString
		var intervalValue sql.NullInt64
		if err := rows.Scan(&eventName, &eventType, &executeAt, &intervalValue, &intervalField, &status, &onCompletion); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		events = append(events, map[string]interface{}{
			"name":         eventName.String,
			"type":         eventType.String,
			"execute_at":   executeAt.String,
			"interval":     intervalValue.Int64,
			"interval_field": intervalField.String,
			"status":       status.String,
			"on_completion": onCompletion.String,
		})
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"events": events})
}

func (h *EventsHandler) Create(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req struct {
		Database  string `json:"database"`
		Name      string `json:"name"`
		Body      string `json:"body"`
		ExecuteAt string `json:"execute_at"`
		Every     string `json:"every"`
		Interval  string `json:"interval"`
		Status    string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Database == "" || req.Name == "" || req.Body == "" {
		writeError(w, http.StatusBadRequest, "database, name, and body are required")
		return
	}

	query := fmt.Sprintf("USE `%s`", req.Database)
	if _, err := db.Exec(query); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var createSQL string
	if req.Every != "" {
		createSQL = fmt.Sprintf("CREATE EVENT `%s` ON SCHEDULE EVERY %s %s", req.Name, req.Interval, req.Every)
	} else if req.ExecuteAt != "" {
		createSQL = fmt.Sprintf("CREATE EVENT `%s` ON SCHEDULE AT '%s'", req.Name, req.ExecuteAt)
	} else {
		createSQL = fmt.Sprintf("CREATE EVENT `%s` ON SCHEDULE EVERY 1 DAY", req.Name)
	}

	if req.Status != "" {
		createSQL += " " + req.Status
	}

	createSQL += " DO " + req.Body

	if _, err := db.Exec(createSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Event created successfully"})
}

func (h *EventsHandler) Drop(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := r.URL.Query().Get("db")
	eventName := r.URL.Query().Get("event")

	if dbName == "" || eventName == "" {
		writeError(w, http.StatusBadRequest, "database and event name are required")
		return
	}

	query := fmt.Sprintf("USE `%s`", dbName)
	if _, err := db.Exec(query); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	dropSQL := fmt.Sprintf("DROP EVENT IF EXISTS `%s`", eventName)
	if _, err := db.Exec(dropSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Event dropped successfully"})
}
