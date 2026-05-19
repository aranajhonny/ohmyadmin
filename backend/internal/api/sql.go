package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
	"github.com/aranajhonny/ohmyadmin/backend/internal/database"
)

type SQLHandler struct{}

func NewSQLHandler() *SQLHandler {
	return &SQLHandler{}
}

func (h *SQLHandler) Execute(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req struct {
		Query string `json:"query"`
		DB    string `json:"db,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Query == "" {
		writeError(w, http.StatusBadRequest, "query is required")
		return
	}

	executionDB := db
	if req.DB != "" {
		_, err := db.ExecContext(r.Context(), "USE `"+req.DB+"`")
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid database: "+err.Error())
			return
		}
	}

	result, err := database.ExecuteSQL(r.Context(), executionDB, req.Query)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *SQLHandler) Format(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Query string `json:"query"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Query == "" {
		writeError(w, http.StatusBadRequest, "query is required")
		return
	}

	formatted := formatSQL(req.Query)
	writeJSON(w, http.StatusOK, map[string]string{"formatted": formatted})
}

func (h *SQLHandler) AutoComplete(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		writeJSON(w, http.StatusOK, map[string][]string{"suggestions": {}})
		return
	}

	suggestions, err := getSQLSuggestions(r.Context(), db, query)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string][]string{"suggestions": suggestions})
}

func getSQLSuggestions(ctx context.Context, db *sql.DB, query string) ([]string, error) {
	var suggestions []string
	upperQuery := strings.ToUpper(query)
	
	// SQL keywords
	keywords := []string{"SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE", "TRUNCATE TABLE", "UNION", "UNION ALL"}
	
	for _, kw := range keywords {
		if strings.HasPrefix(kw, upperQuery) {
			suggestions = append(suggestions, kw)
		}
	}
	
	// Database names if query starts with database-related keywords
	if strings.Contains(upperQuery, "FROM") || strings.Contains(upperQuery, "TABLE") {
		rows, err := db.QueryContext(ctx, "SHOW DATABASES")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var dbName string
				if err := rows.Scan(&dbName); err == nil {
					if strings.HasPrefix(strings.ToUpper(dbName), upperQuery) {
						suggestions = append(suggestions, dbName)
					}
				}
			}
		}
	}
	
	// Table names from INFORMATION_SCHEMA
	if strings.Contains(upperQuery, "FROM") || strings.Contains(upperQuery, "JOIN") {
		rows, err := db.QueryContext(ctx, "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var tableName string
				if err := rows.Scan(&tableName); err == nil {
					if strings.HasPrefix(strings.ToUpper(tableName), upperQuery) {
						suggestions = append(suggestions, tableName)
					}
				}
			}
		}
	}
	
	return suggestions, nil
}

func formatSQL(query string) string {
	// Simple SQL formatter - basic formatting
	// In production, use a proper SQL formatter library
	result := ""
	indent := ""
	upperKeywords := []string{"SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM", "CREATE TABLE", "ALTER TABLE", "DROP TABLE"}
	
	words := splitSQLWords(query)
	for i, word := range words {
		upperWord := strings.ToUpper(word)
		isKeyword := false
		for _, kw := range upperKeywords {
			if upperWord == kw {
				isKeyword = true
				break
			}
		}
		
		if isKeyword {
			if i > 0 && result != "" {
				result += "\n" + indent
			}
			result += upperWord + " "
		} else if word == "(" {
			result += word + "\n" + indent + "  "
			indent += "  "
		} else if word == ")" {
			if len(indent) >= 2 {
				indent = indent[:len(indent)-2]
			}
			result += "\n" + indent + word
		} else if word == ";" {
			result += word + "\n"
		} else {
			result += word + " "
		}
	}
	
	return strings.TrimSpace(result)
}

func splitSQLWords(query string) []string {
	var words []string
	current := ""
	inQuotes := false
	quoteChar := rune(0)
	
	for _, ch := range query {
		if (ch == '\'' || ch == '"') && !inQuotes {
			inQuotes = true
			quoteChar = ch
			current += string(ch)
		} else if ch == quoteChar && inQuotes {
			inQuotes = false
			current += string(ch)
		} else if !inQuotes && (ch == ' ' || ch == '\n' || ch == '\t' || ch == '(' || ch == ')' || ch == ';' || ch == ',') {
			if current != "" {
				words = append(words, current)
				current = ""
			}
			if ch == '(' || ch == ')' || ch == ';' {
				words = append(words, string(ch))
			}
		} else {
			current += string(ch)
		}
	}
	
	if current != "" {
		words = append(words, current)
	}
	
	return words
}
