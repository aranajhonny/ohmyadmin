package database

import (
	"context"
	"database/sql"
	"fmt"
)

type ServerVariable struct {
	VariableName string `json:"variable_name"`
	Value        string `json:"value"`
}

type ServerStatus struct {
	VariableName string `json:"variable_name"`
	Value        string `json:"value"`
}

type ProcessInfo struct {
	ID      int64  `json:"id"`
	User    string `json:"user"`
	Host    string `json:"host"`
	DB      string `json:"db"`
	Command string `json:"command"`
	Time    int64  `json:"time"`
	State   string `json:"state"`
	Info    string `json:"info"`
}

type UserInfo struct {
	User     string `json:"user"`
	Host     string `json:"host"`
	Privileges []string `json:"privileges"`
}

func GetServerVariables(ctx context.Context, db *sql.DB) ([]ServerVariable, error) {
	rows, err := db.QueryContext(ctx, "SHOW GLOBAL VARIABLES")
	if err != nil {
		return nil, fmt.Errorf("failed to query variables: %w", err)
	}
	defer rows.Close()

	var variables []ServerVariable
	for rows.Next() {
		var v ServerVariable
		if err := rows.Scan(&v.VariableName, &v.Value); err != nil {
			return nil, fmt.Errorf("failed to scan variable row: %w", err)
		}
		variables = append(variables, v)
	}

	return variables, nil
}

func GetServerStatus(ctx context.Context, db *sql.DB) ([]ServerStatus, error) {
	rows, err := db.QueryContext(ctx, "SHOW GLOBAL STATUS")
	if err != nil {
		return nil, fmt.Errorf("failed to query status: %w", err)
	}
	defer rows.Close()

	var status []ServerStatus
	for rows.Next() {
		var s ServerStatus
		if err := rows.Scan(&s.VariableName, &s.Value); err != nil {
			return nil, fmt.Errorf("failed to scan status row: %w", err)
		}
		status = append(status, s)
	}

	return status, nil
}

func GetProcessList(ctx context.Context, db *sql.DB) ([]ProcessInfo, error) {
	rows, err := db.QueryContext(ctx, "SHOW PROCESSLIST")
	if err != nil {
		return nil, fmt.Errorf("failed to query processlist: %w", err)
	}
	defer rows.Close()

	var processes []ProcessInfo
	for rows.Next() {
		var p ProcessInfo
		var user, host, db, command, state, info sql.NullString
		var time sql.NullInt64
		if err := rows.Scan(&p.ID, &user, &host, &db, &command, &time, &state, &info); err != nil {
			return nil, fmt.Errorf("failed to scan process row: %w", err)
		}
		p.User = user.String
		p.Host = host.String
		p.DB = db.String
		p.Command = command.String
		p.Time = time.Int64
		p.State = state.String
		p.Info = info.String
		processes = append(processes, p)
	}

	return processes, nil
}

func GetUserPrivileges(ctx context.Context, db *sql.DB) ([]UserInfo, error) {
	rows, err := db.QueryContext(ctx, "SELECT user, host FROM mysql.user")
	if err != nil {
		return nil, fmt.Errorf("failed to query users: %w", err)
	}
	defer rows.Close()

	var users []UserInfo
	for rows.Next() {
		var u UserInfo
		if err := rows.Scan(&u.User, &u.Host); err != nil {
			return nil, fmt.Errorf("failed to scan user row: %w", err)
		}
		users = append(users, u)
	}

	return users, nil
}
