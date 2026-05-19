package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/phpmyadmin/phpmyadmin/backend/internal/auth"
)

type RoutinesHandler struct{}

func NewRoutinesHandler() *RoutinesHandler {
	return &RoutinesHandler{}
}

func (h *RoutinesHandler) List(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := r.URL.Query().Get("db")

	query := `
		SELECT ROUTINE_NAME, ROUTINE_TYPE, DTD_IDENTIFIER, ROUTINE_DEFINITION
		FROM INFORMATION_SCHEMA.ROUTINES
		WHERE ROUTINE_SCHEMA = ?
		ORDER BY ROUTINE_NAME
	`

	rows, err := db.Query(query, dbName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	routines := []map[string]interface{}{}
	for rows.Next() {
		var routineName, routineType, dtdIdentifier, routineDefinition sql.NullString
		if err := rows.Scan(&routineName, &routineType, &dtdIdentifier, &routineDefinition); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		routines = append(routines, map[string]interface{}{
			"name":       routineName.String,
			"type":       routineType.String,
			"definition": routineDefinition.String,
		})
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"routines": routines})
}

func (h *RoutinesHandler) Create(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req struct {
		Database   string `json:"database"`
		Name       string `json:"name"`
		Type       string `json:"type"` // PROCEDURE, FUNCTION
		Parameters string `json:"parameters"`
		Returns    string `json:"returns"`
		Body       string `json:"body"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Database == "" || req.Name == "" || req.Type == "" || req.Body == "" {
		writeError(w, http.StatusBadRequest, "database, name, type, and body are required")
		return
	}

	query := fmt.Sprintf("USE `%s`", req.Database)
	if _, err := db.Exec(query); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var createSQL string
	if req.Type == "PROCEDURE" {
		createSQL = fmt.Sprintf("CREATE PROCEDURE `%s` (%s)\n%s", req.Name, req.Parameters, req.Body)
	} else {
		createSQL = fmt.Sprintf("CREATE FUNCTION `%s` (%s) RETURNS %s\n%s", req.Name, req.Parameters, req.Returns, req.Body)
	}

	if _, err := db.Exec(createSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Routine created successfully"})
}

func (h *RoutinesHandler) Drop(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := r.URL.Query().Get("db")
	routineName := r.URL.Query().Get("routine")
	routineType := r.URL.Query().Get("type")

	if dbName == "" || routineName == "" || routineType == "" {
		writeError(w, http.StatusBadRequest, "database, routine name, and type are required")
		return
	}

	query := fmt.Sprintf("USE `%s`", dbName)
	if _, err := db.Exec(query); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	dropSQL := fmt.Sprintf("DROP %s IF EXISTS `%s`", routineType, routineName)
	if _, err := db.Exec(dropSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "Routine dropped successfully"})
}
