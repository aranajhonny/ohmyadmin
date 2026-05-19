package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/aranajhonny/ohmyadmin/backend/internal/auth"
	"github.com/aranajhonny/ohmyadmin/backend/internal/database"
	"github.com/aranajhonny/ohmyadmin/backend/internal/models"
)

type TableHandler struct{}

type ColumnDef struct {
	Name          string `json:"name"`
	Type          string `json:"type"`
	NotNull       bool   `json:"not_null"`
	DefaultValue string `json:"default_value"`
	AutoIncrement bool   `json:"auto_increment"`
	PrimaryKey    bool   `json:"primary_key"`
	Unique        bool   `json:"unique"`
	Comment       string `json:"comment"`
}

func NewTableHandler() *TableHandler {
	return &TableHandler{}
}

func (h *TableHandler) List(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tables, err := database.GetTables(r.Context(), db, dbName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, tables)
}

func (h *TableHandler) Info(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	tables, err := database.GetTables(r.Context(), db, dbName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	for _, t := range tables {
		if t.Name == tableName {
			writeJSON(w, http.StatusOK, t)
			return
		}
	}

	writeError(w, http.StatusNotFound, fmt.Sprintf("table %s not found", tableName))
}

func (h *TableHandler) Columns(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	columns, err := database.GetColumns(r.Context(), db, dbName, tableName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, columns)
}

func (h *TableHandler) Indexes(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	indexes, err := database.GetIndexes(r.Context(), db, dbName, tableName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, indexes)
}

func (h *TableHandler) Data(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 || perPage > 500 {
		perPage = 50
	}
	sortBy := r.URL.Query().Get("sort_by")
	sortOrder := r.URL.Query().Get("sort_order")
	if sortOrder != "asc" && sortOrder != "DESC" {
		sortOrder = "ASC"
	}
	search := r.URL.Query().Get("search")

	offset := (page - 1) * perPage

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM `%s`.`%s`", dbName, tableName)
	var totalRows int64
	if err := db.QueryRowContext(r.Context(), countQuery).Scan(&totalRows); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	columns, err := database.GetColumns(r.Context(), db, dbName, tableName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	dataQuery := fmt.Sprintf("SELECT * FROM `%s`.`%s`", dbName, tableName)
	if search != "" {
		var searchClauses []string
		for _, col := range columns {
			searchClauses = append(searchClauses,
				fmt.Sprintf("`%s` LIKE '%%%s%%'", col.Field, search))
		}
		if len(searchClauses) > 0 {
			query := searchClauses[0]
			for _, clause := range searchClauses[1:] {
				query += " OR " + clause
			}
			dataQuery += " WHERE (" + query + ")"
		}
	}
	if sortBy != "" {
		dataQuery += fmt.Sprintf(" ORDER BY `%s` %s", sortBy, sortOrder)
	}
	if perPage > 0 {
		dataQuery += fmt.Sprintf(" LIMIT %d OFFSET %d", perPage, offset)
	}

	sqlResult, err := database.ExecuteSQL(r.Context(), db, dataQuery)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	result := &models.TableDataResult{
		Columns:   columns,
		Rows:      sqlResult.Rows,
		TotalRows: totalRows,
		Page:      page,
		PerPage:   perPage,
		QueryTime: sqlResult.QueryTime,
	}

	writeJSON(w, http.StatusOK, result)
}

func (h *TableHandler) InsertRow(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var rowData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&rowData); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	columns, err := database.GetColumns(r.Context(), db, dbName, tableName)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	cols := ""
	vals := ""
	args := []interface{}{}
	i := 0
	for _, col := range columns {
		if val, ok := rowData[col.Field]; ok {
			if i > 0 {
				cols += ", "
				vals += ", "
			}
			cols += "`" + col.Field + "`"
			vals += "?"
			args = append(args, val)
			i++
		}
	}

	query := fmt.Sprintf("INSERT INTO `%s`.`%s` (%s) VALUES (%s)", dbName, tableName, cols, vals)
	result, err := db.ExecContext(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	id, _ := result.LastInsertId()
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":      "row inserted",
		"inserted_id":  id,
	})
}

func (h *TableHandler) UpdateRow(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var req struct {
		Data   map[string]interface{} `json:"data"`
		Where  map[string]interface{} `json:"where"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	setClauses := ""
	args := []interface{}{}
	i := 0
	for col, val := range req.Data {
		if i > 0 {
			setClauses += ", "
		}
		setClauses += "`" + col + "` = ?"
		args = append(args, val)
		i++
	}

	whereClauses := ""
	i = 0
	for col, val := range req.Where {
		if i > 0 {
			whereClauses += " AND "
		}
		whereClauses += "`" + col + "` = ?"
		args = append(args, val)
		i++
	}

	query := fmt.Sprintf("UPDATE `%s`.`%s` SET %s WHERE %s", dbName, tableName, setClauses, whereClauses)
	result, err := db.ExecContext(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	affected, _ := result.RowsAffected()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "row updated",
		"affected_rows": affected,
	})
}

func (h *TableHandler) DeleteRow(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var where map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&where); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	whereClauses := ""
	args := []interface{}{}
	i := 0
	for col, val := range where {
		if i > 0 {
			whereClauses += " AND "
		}
		whereClauses += "`" + col + "` = ?"
		args = append(args, val)
		i++
	}

	query := fmt.Sprintf("DELETE FROM `%s`.`%s` WHERE %s", dbName, tableName, whereClauses)
	result, err := db.ExecContext(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	affected, _ := result.RowsAffected()
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":       "row(s) deleted",
		"affected_rows": affected,
	})
}

func (h *TableHandler) Create(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")

	var req struct {
		CreateSQL string `json:"create_sql"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CreateSQL == "" {
		writeError(w, http.StatusBadRequest, "create_sql is required")
		return
	}

	if err := database.CreateTable(r.Context(), db, dbName, req.CreateSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "table created"})
}

func (h *TableHandler) Drop(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	if err := database.DropTable(r.Context(), db, dbName, tableName); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "table dropped"})
}

func (h *TableHandler) AddIndex(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var req struct {
		IndexName        string `json:"index_name"`
		IndexDefinition  string `json:"index_definition"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.IndexName == "" || req.IndexDefinition == "" {
		writeError(w, http.StatusBadRequest, "index_name and index_definition are required")
		return
	}

	if err := database.AddIndex(r.Context(), db, dbName, tableName, req.IndexName, req.IndexDefinition); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "index added"})
}

func (h *TableHandler) AlterStructure(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var req struct {
		AlterSQL string `json:"alter_sql"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.AlterSQL == "" {
		writeError(w, http.StatusBadRequest, "alter_sql is required")
		return
	}

	if err := database.AlterTable(r.Context(), db, dbName, tableName, req.AlterSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "table structure altered"})
}

func (h *TableHandler) CreateTableStructured(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")

	var req struct {
		TableName string       `json:"table_name"`
		Columns   []ColumnDef  `json:"columns"`
		Engine    string       `json:"engine"`
		Collation string       `json:"collation"`
		Comment   string       `json:"comment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TableName == "" {
		writeError(w, http.StatusBadRequest, "table_name is required")
		return
	}

	if len(req.Columns) == 0 {
		writeError(w, http.StatusBadRequest, "at least one column is required")
		return
	}

	// Build CREATE TABLE statement
	createSQL := fmt.Sprintf("CREATE TABLE `%s` (\n", req.TableName)
	
	for i, col := range req.Columns {
		if i > 0 {
			createSQL += ",\n"
		}
		createSQL += fmt.Sprintf("  `%s` %s", col.Name, col.Type)
		if col.NotNull {
			createSQL += " NOT NULL"
		}
		if col.DefaultValue != "" {
			createSQL += fmt.Sprintf(" DEFAULT %s", col.DefaultValue)
		}
		if col.AutoIncrement {
			createSQL += " AUTO_INCREMENT"
		}
		if col.PrimaryKey {
			createSQL += " PRIMARY KEY"
		}
		if col.Unique {
			createSQL += " UNIQUE"
		}
		if col.Comment != "" {
			createSQL += fmt.Sprintf(" COMMENT '%s'", col.Comment)
		}
	}
	
	createSQL += "\n)"

	if req.Engine != "" {
		createSQL += fmt.Sprintf(" ENGINE=%s", req.Engine)
	}
	if req.Collation != "" {
		createSQL += fmt.Sprintf(" COLLATE=%s", req.Collation)
	}
	if req.Comment != "" {
		createSQL += fmt.Sprintf(" COMMENT='%s'", req.Comment)
	}

	if err := database.CreateTable(r.Context(), db, dbName, createSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "table created"})
}

func (h *TableHandler) AddColumn(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var req struct {
		Column         ColumnDef `json:"column"`
		AfterColumn    string    `json:"after_column"`
		FirstColumn    bool      `json:"first_column"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Column.Name == "" || req.Column.Type == "" {
		writeError(w, http.StatusBadRequest, "column name and type are required")
		return
	}

	alterSQL := fmt.Sprintf("ALTER TABLE `%s`.`%s` ADD COLUMN `%s` %s", dbName, tableName, req.Column.Name, req.Column.Type)
	
	if req.Column.NotNull {
		alterSQL += " NOT NULL"
	}
	if req.Column.DefaultValue != "" {
		alterSQL += fmt.Sprintf(" DEFAULT %s", req.Column.DefaultValue)
	}
	if req.Column.AutoIncrement {
		alterSQL += " AUTO_INCREMENT"
	}
	if req.Column.Unique {
		alterSQL += " UNIQUE"
	}
	if req.Column.Comment != "" {
		alterSQL += fmt.Sprintf(" COMMENT '%s'", req.Column.Comment)
	}

	if req.FirstColumn {
		alterSQL += " FIRST"
	} else if req.AfterColumn != "" {
		alterSQL += fmt.Sprintf(" AFTER `%s`", req.AfterColumn)
	}

	if err := database.AlterTable(r.Context(), db, dbName, tableName, alterSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, map[string]string{"message": "column added"})
}

func (h *TableHandler) DropColumn(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")
	columnName := chi.URLParam(r, "column")

	if columnName == "" {
		writeError(w, http.StatusBadRequest, "column parameter is required")
		return
	}

	alterSQL := fmt.Sprintf("ALTER TABLE `%s`.`%s` DROP COLUMN `%s`", dbName, tableName, columnName)

	if err := database.AlterTable(r.Context(), db, dbName, tableName, alterSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "column dropped"})
}

func (h *TableHandler) AlterColumn(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")
	columnName := chi.URLParam(r, "column")

	var req struct {
		NewName     string `json:"new_name"`
		NewType     string `json:"new_type"`
		NotNull     *bool  `json:"not_null"`
		DefaultValue string `json:"default_value"`
		Comment     string `json:"comment"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if columnName == "" {
		writeError(w, http.StatusBadRequest, "column parameter is required")
		return
	}

	var alterSQL string
	if req.NewName != "" && req.NewName != columnName {
		alterSQL = fmt.Sprintf("ALTER TABLE `%s`.`%s` CHANGE COLUMN `%s` `%s`", dbName, tableName, columnName, req.NewName)
	} else {
		alterSQL = fmt.Sprintf("ALTER TABLE `%s`.`%s` MODIFY COLUMN `%s`", dbName, tableName, columnName)
	}

	if req.NewType != "" {
		alterSQL += " " + req.NewType
	}

	if req.NotNull != nil {
		if *req.NotNull {
			alterSQL += " NOT NULL"
		} else {
			alterSQL += " NULL"
		}
	}

	if req.DefaultValue != "" {
		alterSQL += fmt.Sprintf(" DEFAULT %s", req.DefaultValue)
	}

	if req.Comment != "" {
		alterSQL += fmt.Sprintf(" COMMENT '%s'", req.Comment)
	}

	if err := database.AlterTable(r.Context(), db, dbName, tableName, alterSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "column altered"})
}

func (h *TableHandler) DropIndex(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")
	indexName := chi.URLParam(r, "index")

	if indexName == "" {
		writeError(w, http.StatusBadRequest, "index parameter is required")
		return
	}

	alterSQL := fmt.Sprintf("ALTER TABLE `%s`.`%s` DROP INDEX `%s`", dbName, tableName, indexName)

	if err := database.AlterTable(r.Context(), db, dbName, tableName, alterSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "index dropped"})
}

func (h *TableHandler) RenameTable(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	var req struct {
		NewTableName string `json:"new_table_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.NewTableName == "" {
		writeError(w, http.StatusBadRequest, "new_table_name is required")
		return
	}

	alterSQL := fmt.Sprintf("RENAME TABLE `%s`.`%s` TO `%s`.`%s`", dbName, tableName, dbName, req.NewTableName)

	if err := database.AlterTable(r.Context(), db, dbName, tableName, alterSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "table renamed"})
}

func (h *TableHandler) TruncateTable(w http.ResponseWriter, r *http.Request) {
	db := auth.GetDB(r)
	if db == nil {
		writeError(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	dbName := chi.URLParam(r, "db")
	tableName := chi.URLParam(r, "table")

	alterSQL := fmt.Sprintf("TRUNCATE TABLE `%s`.`%s`", dbName, tableName)

	if err := database.AlterTable(r.Context(), db, dbName, tableName, alterSQL); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"message": "table truncated"})
}
