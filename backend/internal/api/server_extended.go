package api

import (
	"net/http"

	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
	"github.com/aranajhonny/ohmyadmin/backend/internal/database"
)

type ServerExtendedHandler struct{}

func NewServerExtendedHandler() *ServerExtendedHandler {
	return &ServerExtendedHandler{}
}

func (h *ServerExtendedHandler) GetVariables(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	variables, err := database.GetServerVariables(r.Context(), db)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, variables)
}

func (h *ServerExtendedHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	status, err := database.GetServerStatus(r.Context(), db)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, status)
}

func (h *ServerExtendedHandler) GetProcessList(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	processes, err := database.GetProcessList(r.Context(), db)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, processes)
}

func (h *ServerExtendedHandler) GetPrivileges(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	users, err := database.GetUserPrivileges(r.Context(), db)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, users)
}
