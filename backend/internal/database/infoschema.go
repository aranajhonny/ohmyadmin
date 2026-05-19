package database

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/phpmyadmin/phpmyadmin/backend/internal/models"
)

func GetServerInfo(ctx context.Context, db *sql.DB) (*models.ServerInfo, error) {
	row := db.QueryRowContext(ctx, `SELECT VERSION() as version, @@version_comment as comment`)

	var version, comment string
	if err := row.Scan(&version, &comment); err != nil {
		return nil, fmt.Errorf("failed to get server version: %w", err)
	}

	info := &models.ServerInfo{
		Version: version,
	}

	row = db.QueryRowContext(ctx, "SELECT @@character_set_server, @@collation_server")
	var charset, collation string
	if err := row.Scan(&charset, &collation); err == nil {
		info.Charset = charset
		info.Collation = collation
	}

	row = db.QueryRowContext(ctx, "SHOW GLOBAL STATUS LIKE 'Uptime'")
	var uptimeName, uptime string
	if err := row.Scan(&uptimeName, &uptime); err == nil {
		info.Uptime = uptime
	}

	row = db.QueryRowContext(ctx, "SHOW GLOBAL STATUS LIKE 'Threads_connected'")
	if err := row.Scan(&uptimeName, &uptime); err == nil {
		info.Connections = uptime
	}

	row = db.QueryRowContext(ctx, "SHOW GLOBAL STATUS LIKE 'Questions'")
	if err := row.Scan(&uptimeName, &uptime); err == nil {
		info.Questions = uptime
	}

	row = db.QueryRowContext(ctx, "SHOW GLOBAL STATUS LIKE 'Slow_queries'")
	if err := row.Scan(&uptimeName, &uptime); err == nil {
		info.SlowQueries = uptime
	}

	row = db.QueryRowContext(ctx, "SHOW GLOBAL STATUS LIKE 'Open_tables'")
	if err := row.Scan(&uptimeName, &uptime); err == nil {
		info.OpenTables = uptime
	}

	return info, nil
}

func GetDatabases(ctx context.Context, db *sql.DB) ([]models.DatabaseInfo, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT SCHEMA_NAME, DEFAULT_COLLATION_NAME
		FROM INFORMATION_SCHEMA.SCHEMATA
		ORDER BY SCHEMA_NAME
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query databases: %w", err)
	}
	defer rows.Close()

	var databases []models.DatabaseInfo
	for rows.Next() {
		var d models.DatabaseInfo
		var collation sql.NullString
		if err := rows.Scan(&d.Name, &collation); err != nil {
			return nil, fmt.Errorf("failed to scan database row: %w", err)
		}
		d.Collation = collation.String
		d.IsSystem = isSystemSchema(d.Name)
		databases = append(databases, d)
	}

	return databases, nil
}

func GetTables(ctx context.Context, db *sql.DB, dbName string) ([]models.TableInfo, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT TABLE_NAME, ENGINE, TABLE_ROWS, AVG_ROW_LENGTH,
			DATA_LENGTH, MAX_DATA_LENGTH, INDEX_LENGTH, DATA_FREE,
			AUTO_INCREMENT, CREATE_TIME, UPDATE_TIME, CHECK_TIME,
			TABLE_COLLATION, TABLE_COMMENT, TABLE_TYPE
		FROM INFORMATION_SCHEMA.TABLES
		WHERE TABLE_SCHEMA = ?
		ORDER BY TABLE_NAME
	`, dbName)
	if err != nil {
		return nil, fmt.Errorf("failed to query tables: %w", err)
	}
	defer rows.Close()

	var tables []models.TableInfo
	for rows.Next() {
		var t models.TableInfo
		var engine, createTime, tableType, tableCollation, tableComment sql.NullString
		var updateTime, checkTime sql.NullString
		var autoIncrement sql.NullString
		var avgRowLength, maxDataLength, dataFree sql.NullInt64

		if err := rows.Scan(
			&t.Name, &engine, &t.Rows, &avgRowLength,
			&t.DataLength, &maxDataLength, &t.IndexLength, &dataFree,
			&autoIncrement, &createTime, &updateTime, &checkTime,
			&tableCollation, &tableComment, &tableType,
		); err != nil {
			return nil, fmt.Errorf("failed to scan table row: %w", err)
		}

		t.Engine = engine.String
		t.AvgRowLength = avgRowLength.Int64
		t.MaxDataLength = maxDataLength.Int64
		t.DataFree = dataFree.Int64
		t.AutoIncrement = autoIncrement.String
		t.CreateTime = createTime.String
		t.UpdateTime = updateTime.String
		t.CheckTime = checkTime.String
		t.Collation = tableCollation.String
		t.Comment = tableComment.String
		t.Type = tableType.String
		tables = append(tables, t)
	}

	return tables, nil
}

func GetColumns(ctx context.Context, db *sql.DB, dbName, tableName string) ([]models.ColumnInfo, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT COLUMN_NAME, COLUMN_TYPE, COLLATION_NAME,
			IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT,
			EXTRA, PRIVILEGES, COLUMN_COMMENT
		FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION
	`, dbName, tableName)
	if err != nil {
		return nil, fmt.Errorf("failed to query columns: %w", err)
	}
	defer rows.Close()

	var columns []models.ColumnInfo
	for rows.Next() {
		var c models.ColumnInfo
		var collation, defaultVal, privileges, comment sql.NullString

		if err := rows.Scan(
			&c.Field, &c.Type, &collation,
			&c.Null, &c.Key, &defaultVal,
			&c.Extra, &privileges, &comment,
		); err != nil {
			return nil, fmt.Errorf("failed to scan column row: %w", err)
		}

		c.Collation = collation.String
		c.Default = nil
		if defaultVal.Valid {
			c.Default = &defaultVal.String
		}
		c.Privileges = privileges.String
		c.Comment = comment.String
		columns = append(columns, c)
	}

	return columns, nil
}

func GetIndexes(ctx context.Context, db *sql.DB, dbName, tableName string) ([]models.IndexInfo, error) {
	rows, err := db.QueryContext(ctx, `
		SHOW INDEX FROM `+"`"+tableName+"`"+` FROM `+"`"+dbName+"`")
	if err != nil {
		return nil, fmt.Errorf("failed to query indexes: %w", err)
	}
	defer rows.Close()

	var indexes []models.IndexInfo
	for rows.Next() {
		var idx models.IndexInfo
		var nonUnique, seqInIndex, cardinality int
		var collation, subPart, packed, nullVal, comment, indexComment, visible, expression sql.NullString

		if err := rows.Scan(
			&idx.Table, &nonUnique, &idx.KeyName, &seqInIndex,
			&idx.ColumnName, &collation, &cardinality, &subPart,
			&packed, &nullVal, &idx.IndexType, &comment,
			&indexComment, &visible, &expression,
		); err != nil {
			return nil, fmt.Errorf("failed to scan index row: %w", err)
		}

		idx.NonUnique = nonUnique != 0
		idx.SeqInIndex = seqInIndex
		idx.Cardinality = cardinality
		idx.Collation = collation.String
		idx.SubPart = subPart.String
		idx.Packed = packed.String
		idx.Null = nullVal.String
		idx.Comment = comment.String
		idx.IndexComment = indexComment.String
		idx.Visible = visible.String == "YES"
		indexes = append(indexes, idx)
	}

	return indexes, nil
}

func CreateDatabase(ctx context.Context, db *sql.DB, name, collation string) error {
	query := fmt.Sprintf("CREATE DATABASE `%s`", name)
	if collation != "" {
		query += fmt.Sprintf(" COLLATE '%s'", collation)
	}
	_, err := db.ExecContext(ctx, query)
	return err
}

func DropDatabase(ctx context.Context, db *sql.DB, name string) error {
	_, err := db.ExecContext(ctx, fmt.Sprintf("DROP DATABASE `%s`", name))
	return err
}

func isSystemSchema(name string) bool {
	systemSchemas := map[string]bool{
		"information_schema": true,
		"mysql":              true,
		"performance_schema": true,
		"sys":                true,
	}
	return systemSchemas[name]
}

func CreateTable(ctx context.Context, db *sql.DB, dbName string, createSQL string) error {
	_, err := db.ExecContext(ctx, fmt.Sprintf("USE `%s`", dbName))
	if err != nil {
		return fmt.Errorf("failed to use database: %w", err)
	}
	_, err = db.ExecContext(ctx, createSQL)
	return err
}

func AddIndex(ctx context.Context, db *sql.DB, dbName, tableName, indexName, indexDefinition string) error {
	query := fmt.Sprintf("ALTER TABLE `%s`.`%s` ADD INDEX `%s` %s", dbName, tableName, indexName, indexDefinition)
	_, err := db.ExecContext(ctx, query)
	return err
}

func AlterTable(ctx context.Context, db *sql.DB, dbName, tableName, alterSQL string) error {
	query := fmt.Sprintf("ALTER TABLE `%s`.`%s` %s", dbName, tableName, alterSQL)
	_, err := db.ExecContext(ctx, query)
	return err
}

func DropTable(ctx context.Context, db *sql.DB, dbName, tableName string) error {
	query := fmt.Sprintf("DROP TABLE `%s`.`%s`", dbName, tableName)
	_, err := db.ExecContext(ctx, query)
	return err
}
