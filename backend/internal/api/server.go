package api

import (
	"net/http"

	"github.com/phpmyadmin/phpmyadmin/backend/internal/auth"
	"github.com/phpmyadmin/phpmyadmin/backend/internal/database"
)

func GetServerInfo(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	info, err := database.GetServerInfo(r.Context(), db)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, info)
}
