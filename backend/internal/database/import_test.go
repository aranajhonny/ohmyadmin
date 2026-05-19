package database

import (
	"testing"
)

func TestSplitSQLStatements(t *testing.T) {
	tests := []struct {
		name     string
		sql      string
		expected int
	}{
		{
			name: "Simple statements",
			sql: "CREATE TABLE test (id INT);\nINSERT INTO test VALUES (1);",
			expected: 2,
		},
		{
			name: "With comments",
			sql: "-- This is a comment\nCREATE TABLE test (id INT);",
			expected: 1,
		},
		{
			name: "With empty lines",
			sql: "\n\nCREATE TABLE test (id INT);\n\nINSERT INTO test VALUES (1);\n",
			expected: 2,
		},
		{
			name: "With multi-line comment",
			sql: "/* Multi-line comment */\nCREATE TABLE test (id INT);",
			expected: 1,
		},
		{
			name: "With DELIMITER statement",
			sql: "DELIMITER $$\nCREATE PROCEDURE test() BEGIN END $$\nDELIMITER ;",
			expected: 1,
		},
		{
			name: "Complex CREATE TABLE",
			sql: "CREATE TABLE test (\n  id INT PRIMARY KEY,\n  name VARCHAR(50)\n);",
			expected: 1,
		},
		{
			name: "OhMyAdmin dump format",
			sql: `-- OhMyAdmin SQL Dump
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE test (
  id INT NOT NULL
);

INSERT INTO test VALUES (1);

COMMIT;`,
			expected: 6,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := splitSQLStatements(tt.sql)
			if len(result) != tt.expected {
				t.Errorf("Expected %d statements, got %d", tt.expected, len(result))
			}
		})
	}
}

func TestSplitSQLStatementsContent(t *testing.T) {
	sql := "CREATE TABLE test (id INT);\nINSERT INTO test VALUES (1);"
	result := splitSQLStatements(sql)
	
	if len(result) != 2 {
		t.Fatalf("Expected 2 statements, got %d", len(result))
	}
	
	expectedFirst := "CREATE TABLE test (id INT);"
	if result[0] != expectedFirst {
		t.Errorf("Expected first statement %q, got %q", expectedFirst, result[0])
	}
	
	expectedSecond := "INSERT INTO test VALUES (1);"
	if result[1] != expectedSecond {
		t.Errorf("Expected second statement %q, got %q", expectedSecond, result[1])
	}
}

func TestSplitSQLStatementsSkipsComments(t *testing.T) {
	sql := `-- Comment 1
-- Comment 2
CREATE TABLE test (id INT);`
	
	result := splitSQLStatements(sql)
	
	if len(result) != 1 {
		t.Fatalf("Expected 1 statement, got %d", len(result))
	}
	
	if !contains(result[0], "CREATE TABLE") {
		t.Errorf("Expected CREATE TABLE statement, got %q", result[0])
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && 
		(s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || 
		indexOf(s, substr) >= 0))
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
