export interface ServerInfo {
  version: string
  version_int: number
  is_maria_db: boolean
  is_percona: boolean
  collation: string
  charset: string
  uptime: string
  connections: string
  questions: string
  slow_queries: string
  flush_commands: string
  open_tables: string
}

export interface DatabaseInfo {
  name: string
  collation: string
  collation_description?: string
  statistics?: DatabaseStats
  is_system: boolean
}

export interface DatabaseStats {
  tables: number
  rows: number
  data_length: number
  index_length: number
  total_length: number
  data_free: number
}

export interface TableInfo {
  name: string
  engine: string
  version: string
  row_format: string
  rows: number
  avg_row_length: number
  data_length: number
  max_data_length: number
  index_length: number
  data_free: number
  auto_increment?: string
  create_time: string
  update_time?: string
  check_time?: string
  collation: string
  comment: string
  row_type: string
  type: string
}

export interface ColumnInfo {
  field: string
  type: string
  collation: string
  null: string
  key: string
  default: string | null
  extra: string
  privileges: string
  comment: string
}

export interface IndexInfo {
  table: string
  non_unique: boolean
  key_name: string
  seq_in_index: number
  column_name: string
  collation: string
  cardinality: number
  sub_part?: string
  packed?: string
  null: string
  index_type: string
  comment: string
  index_comment: string
  visible: boolean
}

export interface ForeignKey {
  constraint_name: string
  column_name: string
  referenced_table: string
  referenced_column: string
  on_delete: string
  on_update: string
}

export interface TableDataResult {
  columns: ColumnInfo[]
  rows: Record<string, unknown>[]
  total_rows: number
  page: number
  per_page: number
  query_time: number
}

export interface SQLColumn {
  name: string
  type: string
}

export interface SQLResult {
  columns?: SQLColumn[]
  rows?: Record<string, unknown>[]
  affected_rows?: number
  message?: string
  query_time: number
  success: boolean
  error?: string
}

export interface LoginRequest {
  server: string
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: string
}

export interface ServerVariable {
  variable_name: string
  value: string
}

export interface ServerStatus {
  variable_name: string
  value: string
}

export interface ProcessInfo {
  id: number
  user: string
  host: string
  db: string
  command: string
  time: number
  state: string
  info: string
}

export interface UserInfo {
  user: string
  host: string
  privileges: string[]
}
