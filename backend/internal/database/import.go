package database

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

func ImportSQL(ctx context.Context, db *sql.DB, dbName, sqlContent string) error {
	if dbName != "" {
		if _, err := db.ExecContext(ctx, fmt.Sprintf("USE `%s`", dbName)); err != nil {
			return fmt.Errorf("failed to use database: %w", err)
		}
	}

	statements := splitSQLStatements(sqlContent)
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(strings.ToUpper(stmt), "--") {
			continue
		}
		if _, err := db.ExecContext(ctx, stmt); err != nil {
			return fmt.Errorf("failed to execute statement: %w\nStatement: %s", err, stmt)
		}
	}

	return nil
}

func splitSQLStatements(sqlContent string) []string {
	var statements []string
	var currentStmt strings.Builder
	lines := strings.Split(sqlContent, "\n")
	
	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)
		
		// Skip empty lines and single-line comments
		if trimmedLine == "" || strings.HasPrefix(trimmedLine, "--") {
			continue
		}
		
		// Skip multi-line comment blocks
		if strings.HasPrefix(trimmedLine, "/*") && strings.HasSuffix(trimmedLine, "*/") {
			continue
		}
		
		// Handle DELIMITER statements (for stored procedures/functions)
		if strings.HasPrefix(strings.ToUpper(trimmedLine), "DELIMITER") {
			// Add current statement if exists
			if currentStmt.Len() > 0 {
				stmt := strings.TrimSpace(currentStmt.String())
				if stmt != "" {
					statements = append(statements, stmt)
				}
				currentStmt.Reset()
			}
			// Skip the DELIMITER statement itself
			continue
		}
		
		currentStmt.WriteString(line)
		currentStmt.WriteString("\n")
		
		// Check if line ends with semicolon (end of statement)
		if strings.HasSuffix(trimmedLine, ";") {
			stmt := strings.TrimSpace(currentStmt.String())
			if stmt != "" {
				statements = append(statements, stmt)
			}
			currentStmt.Reset()
		}
	}
	
	// Add any remaining statement
	if currentStmt.Len() > 0 {
		stmt := strings.TrimSpace(currentStmt.String())
		if stmt != "" {
			statements = append(statements, stmt)
		}
	}
	
	return statements
}
