package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestImportHandler_ImportDatabase(t *testing.T) {
	handler := NewImportHandler()

	tests := []struct {
		name           string
		body           map[string]string
		expectedStatus int
	}{
		{
			name: "Valid import",
			body: map[string]string{
				"database_name": "test_db",
				"sql_content":   "CREATE TABLE test (id INT);",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name: "Missing database name",
			body: map[string]string{
				"sql_content": "CREATE TABLE test (id INT);",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Missing SQL content",
			body: map[string]string{
				"database_name": "test_db",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "Empty body",
			body:           map[string]string{},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.body)
			req := httptest.NewRequest("POST", "/api/import/database", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			
			w := httptest.NewRecorder()
			
			// Note: This will fail without proper auth setup, but tests the JSON parsing
			handler.ImportDatabase(w, req)
			
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func TestImportHandler_Import(t *testing.T) {
	handler := NewImportHandler()

	tests := []struct {
		name           string
		dbName         string
		body           map[string]string
		expectedStatus int
	}{
		{
			name:   "Valid import with JSON body",
			dbName: "test_db",
			body: map[string]string{
				"sql_content": "CREATE TABLE test (id INT);",
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "Missing SQL content",
			dbName: "test_db",
			body: map[string]string{
				"other_field": "value",
			},
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.body)
			req := httptest.NewRequest("POST", "/api/import/"+tt.dbName, bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			
			w := httptest.NewRecorder()
			
			handler.Import(w, req)
			
			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}
		})
	}
}

func TestImportHandler_ImportWithFile(t *testing.T) {
	handler := NewImportHandler()

	// Create a mock multipart form
	body := &bytes.Buffer{}
	writer := func() *strings.Builder {
		return &strings.Builder{}
	}()
	
	// This is a simplified test - in a real scenario you'd use multipart writer
	sqlContent := "CREATE TABLE test (id INT);"
	
	req := httptest.NewRequest("POST", "/api/import/test_db", strings.NewReader(sqlContent))
	req.Header.Set("Content-Type", "multipart/form-data")
	
	w := httptest.NewRecorder()
	
	handler.Import(w, req)
	
	// Should fail because it's not properly formatted as multipart
	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid multipart, got %d", w.Code)
	}
}
