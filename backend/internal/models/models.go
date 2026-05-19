package models

type ServerInfo struct {
	Version       string `json:"version"`
	VersionInt    int    `json:"version_int"`
	IsMariaDB     bool   `json:"is_maria_db"`
	IsPercona     bool   `json:"is_percona"`
	Collation     string `json:"collation"`
	Charset       string `json:"charset"`
	Uptime        string `json:"uptime"`
	Connections   string `json:"connections"`
	Questions     string `json:"questions"`
	SlowQueries   string `json:"slow_queries"`
	FlushCommands string `json:"flush_commands"`
	OpenTables    string `json:"open_tables"`
}

type DatabaseInfo struct {
	Name         string           `json:"name"`
	Collation    string           `json:"collation"`
	CollationDesc string          `json:"collation_description,omitempty"`
	Statistics   *DatabaseStats   `json:"statistics,omitempty"`
	IsSystem      bool            `json:"is_system"`
}

type DatabaseStats struct {
	Tables      int    `json:"tables"`
	Rows        int    `json:"rows"`
	DataLength  int64  `json:"data_length"`
	IndexLength int64  `json:"index_length"`
	TotalLength int64  `json:"total_length"`
	DataFree    int64  `json:"data_free"`
}

type TableInfo struct {
	Name         string          `json:"name"`
	Engine       string          `json:"engine"`
	Version      string          `json:"version"`
	RowFormat    string          `json:"row_format"`
	Rows         int64           `json:"rows"`
	AvgRowLength int64           `json:"avg_row_length"`
	DataLength   int64           `json:"data_length"`
	MaxDataLength int64          `json:"max_data_length"`
	IndexLength  int64           `json:"index_length"`
	DataFree     int64           `json:"data_free"`
	AutoIncrement string         `json:"auto_increment,omitempty"`
	CreateTime   string          `json:"create_time"`
	UpdateTime   string          `json:"update_time,omitempty"`
	CheckTime    string          `json:"check_time,omitempty"`
	Collation    string          `json:"collation"`
	Comment      string          `json:"comment"`
	RowType      string          `json:"row_type"`
	Type         string          `json:"type"` // table or view
}

type ColumnInfo struct {
	Field      string  `json:"field"`
	Type       string  `json:"type"`
	Collation  string  `json:"collation"`
	Null       string  `json:"null"`
	Key        string  `json:"key"`
	Default    *string `json:"default"`
	Extra      string  `json:"extra"`
	Privileges string  `json:"privileges"`
	Comment    string  `json:"comment"`
}

type IndexInfo struct {
	Table        string `json:"table"`
	NonUnique    bool   `json:"non_unique"`
	KeyName      string `json:"key_name"`
	SeqInIndex   int    `json:"seq_in_index"`
	ColumnName   string `json:"column_name"`
	Collation    string `json:"collation"`
	Cardinality  int    `json:"cardinality"`
	SubPart      string `json:"sub_part,omitempty"`
	Packed       string `json:"packed,omitempty"`
	Null         string `json:"null"`
	IndexType    string `json:"index_type"`
	Comment      string `json:"comment"`
	IndexComment string `json:"index_comment"`
	Visible      bool   `json:"visible"`
}

type TableDataResult struct {
	Columns    []ColumnInfo             `json:"columns"`
	Rows       []map[string]interface{} `json:"rows"`
	TotalRows  int64                    `json:"total_rows"`
	Page       int                      `json:"page"`
	PerPage    int                      `json:"per_page"`
	QueryTime  float64                  `json:"query_time"`
}

type SQLResult struct {
	Columns    []SQLColumn             `json:"columns,omitempty"`
	Rows       []map[string]interface{} `json:"rows,omitempty"`
	AffectedRows int64                 `json:"affected_rows,omitempty"`
	Message    string                  `json:"message,omitempty"`
	QueryTime  float64                 `json:"query_time"`
	Success    bool                    `json:"success"`
	Error      string                  `json:"error,omitempty"`
}

type SQLColumn struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type LoginRequest struct {
	Server   string `json:"server"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  string `json:"user"`
}

type UserInfo struct {
	User         string   `json:"user"`
	Host         string   `json:"host"`
	IsSuperUser  bool     `json:"is_super_user"`
	IsGrantUser  bool     `json:"is_grant_user"`
	IsCreateUser bool     `json:"is_create_user"`
	Roles        []string `json:"roles"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code,omitempty"`
}
