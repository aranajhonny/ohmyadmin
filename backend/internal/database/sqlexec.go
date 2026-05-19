package database

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/aranajhonny/ohmyadmin/backend/internal/models"
)

func ExecuteSQL(ctx context.Context, db *sql.DB, query string) (*models.SQLResult, error) {
	start := time.Now()
	result := &models.SQLResult{}

	trimmedQuery := strings.TrimSpace(query)
	if trimmedQuery == "" {
		result.Success = true
		result.Message = "Query was empty"
		return result, nil
	}

	upper := strings.ToUpper(trimmedQuery)

	if strings.HasPrefix(upper, "SELECT") ||
		strings.HasPrefix(upper, "SHOW") ||
		strings.HasPrefix(upper, "DESCRIBE") ||
		strings.HasPrefix(upper, "DESC") ||
		strings.HasPrefix(upper, "EXPLAIN") ||
		strings.HasPrefix(upper, "WITH") {
		rows, err := db.QueryContext(ctx, query)
		if err != nil {
			result.Success = false
			result.Error = err.Error()
			result.QueryTime = time.Since(start).Seconds()
			return result, nil
		}
		defer rows.Close()

		columns, err := rows.Columns()
		if err != nil {
			result.Success = false
			result.Error = err.Error()
			result.QueryTime = time.Since(start).Seconds()
			return result, nil
		}

		columnTypes, err := rows.ColumnTypes()
		if err != nil {
			result.Success = false
			result.Error = err.Error()
			result.QueryTime = time.Since(start).Seconds()
			return result, nil
		}

		for i, col := range columns {
			typeName := "string"
			if i < len(columnTypes) {
				typeName = columnTypes[i].DatabaseTypeName()
			}
			result.Columns = append(result.Columns, models.SQLColumn{
				Name: col,
				Type: typeName,
			})
		}

		for rows.Next() {
			values := make([]interface{}, len(columns))
			valuePtrs := make([]interface{}, len(columns))
			for i := range columns {
				valuePtrs[i] = &values[i]
			}

			if err := rows.Scan(valuePtrs...); err != nil {
				result.Success = false
				result.Error = err.Error()
				result.QueryTime = time.Since(start).Seconds()
				return result, nil
			}

			row := make(map[string]interface{})
			for i, col := range columns {
				val := values[i]
				if b, ok := val.([]byte); ok {
					row[col] = string(b)
				} else {
					row[col] = val
				}
			}
			result.Rows = append(result.Rows, row)
		}

		result.Success = true
		result.Message = fmt.Sprintf("Query returned %d rows", len(result.Rows))
	} else {
		res, err := db.ExecContext(ctx, query)
		if err != nil {
			result.Success = false
			result.Error = err.Error()
			result.QueryTime = time.Since(start).Seconds()
			return result, nil
		}

		affected, _ := res.RowsAffected()
		result.AffectedRows = affected
		result.Success = true
		result.Message = fmt.Sprintf("Query executed successfully. %d rows affected.", affected)
	}

	result.QueryTime = time.Since(start).Seconds()
	return result, nil
}
