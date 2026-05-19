import { useAuthStore } from '@/stores/authStore'
import type {
  ServerInfo,
  DatabaseInfo,
  TableInfo,
  ColumnInfo,
  IndexInfo,
  ForeignKey,
  TableDataResult,
  SQLResult,
  LoginRequest,
  LoginResponse,
  ServerVariable,
  ServerStatus,
  ProcessInfo,
  UserInfo,
} from '@/types'

const API_BASE = typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL.length > 0
  ? import.meta.env.VITE_API_URL
  : '/api'

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    if (response.status === 401) {
      useAuthStore.getState().clearAuth()
    }
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Auth
  login: (data: LoginRequest) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  authStatus: () => request<{ authenticated: boolean; user: string }>('/api/auth/status'),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  // Server
  serverInfo: () => request<ServerInfo>('/api/server/info'),

  // Databases
  listDatabases: () => request<DatabaseInfo[]>('/api/databases'),

  createDatabase: (name: string, collation?: string) =>
    request<{ message: string }>('/api/databases', {
      method: 'POST',
      body: JSON.stringify({ name, collation }),
    }),

  dropDatabase: (name: string) =>
    request<{ message: string }>(`/api/databases/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  // Tables
  listTables: (db: string) =>
    request<TableInfo[]>(`/api/databases/${encodeURIComponent(db)}/tables`),

  tableInfo: (db: string, table: string) =>
    request<TableInfo>(`/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}`),

  tableColumns: (db: string, table: string) =>
    request<ColumnInfo[]>(`/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/columns`),

  tableIndexes: (db: string, table: string) =>
    request<IndexInfo[]>(`/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/indexes`),

  tableForeignKeys: (db: string, table: string) =>
    request<ForeignKey[]>(`/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/foreign-keys`),

  tableData: (db: string, table: string, params?: {
    page?: number
    per_page?: number
    sort_by?: string
    sort_order?: string
    search?: string
  }) => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.per_page) query.set('per_page', String(params.per_page))
    if (params?.sort_by) query.set('sort_by', params.sort_by)
    if (params?.sort_order) query.set('sort_order', params.sort_order)
    if (params?.search) query.set('search', params.search)
    const qs = query.toString()
    return request<TableDataResult>(
      `/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/data${qs ? `?${qs}` : ''}`
    )
  },

  insertRow: (db: string, table: string, data: Record<string, unknown>) =>
    request<{ message: string; inserted_id: number }>(
      `/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/data`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  updateRow: (db: string, table: string, data: Record<string, unknown>, where: Record<string, unknown>) =>
    request<{ message: string; affected_rows: number }>(
      `/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/data`,
      { method: 'PUT', body: JSON.stringify({ data, where }) }
    ),

  deleteRow: (db: string, table: string, where: Record<string, unknown>) =>
    request<{ message: string; affected_rows: number }>(
      `/api/databases/${encodeURIComponent(db)}/tables/${encodeURIComponent(table)}/data`,
      { method: 'DELETE', body: JSON.stringify(where) }
    ),

  // SQL
  executeSQL: (query: string, db?: string) =>
    request<SQLResult>('/api/sql/execute', {
      method: 'POST',
      body: JSON.stringify({ query, db }),
    }),

  formatSQL: (query: string) =>
    request<{ formatted: string }>('/api/sql/format', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  autoComplete: (q: string) =>
    request<{ suggestions: string[] }>(`/api/sql/auto-complete?q=${encodeURIComponent(q)}`),

  // Export
  exportDatabase: (db: string, format: 'sql' | 'csv' | 'json' | 'xml' = 'sql') => {
    return fetch(`${API_BASE}/api/export/${encodeURIComponent(db)}?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
      },
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        if (res.status === 401) {
          useAuthStore.getState().clearAuth()
        }
        throw new Error(error.error || `HTTP ${res.status}`)
      }
      return res.text()
    })
  },

  exportTable: (db: string, table: string, format: 'sql' | 'csv' | 'json' | 'xml' = 'sql') => {
    return fetch(`${API_BASE}/api/export/${encodeURIComponent(db)}/${encodeURIComponent(table)}?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${useAuthStore.getState().token}`,
      },
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        if (res.status === 401) {
          useAuthStore.getState().clearAuth()
        }
        throw new Error(error.error || `HTTP ${res.status}`)
      }
      return res.text()
    })
  },

  // Import
  importDatabase: (db: string, sqlContent: string) =>
    request<{ message: string }>('/api/import/database', {
      method: 'POST',
      body: JSON.stringify({ database_name: db, sql_content: sqlContent }),
    }),

  importTable: (db: string, table: string, sqlContent: string) =>
    request<{ message: string }>(`/api/import/${encodeURIComponent(db)}/${encodeURIComponent(table)}`, {
      method: 'POST',
      body: JSON.stringify({ sql_content: sqlContent }),
    }),

  // Server
  serverVariables: () => request<ServerVariable[]>('/api/server/variables'),
  serverStatus: () => request<ServerStatus[]>('/api/server/status'),
  processList: () => request<ProcessInfo[]>('/api/server/processlist'),
  privileges: () => request<UserInfo[]>('/api/server/privileges'),
}
