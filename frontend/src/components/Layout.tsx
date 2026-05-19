import { Outlet, Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import {
  Database,
  Home,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Settings,
  Book,
  HelpCircle,
  Table,
  Search,
  Columns,
  Hash,
  Plus,
} from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const { db: currentDb, table: currentTable } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedDbs, setExpandedDbs] = useState<Set<string>>(new Set())
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const { data: databases = [], refetch: refetchDatabases } = useQuery({
    queryKey: ['databases'],
    queryFn: api.listDatabases,
  })

  const { data: tables = [], refetch: refetchTables } = useQuery({
    queryKey: ['tables', currentDb],
    queryFn: () => currentDb ? api.listTables(currentDb) : Promise.resolve([]),
    enabled: !!currentDb,
  })

  const { data: columns = [] } = useQuery({
    queryKey: ['columns', currentDb, currentTable],
    queryFn: () => currentDb && currentTable ? api.tableColumns(currentDb, currentTable) : Promise.resolve([]),
    enabled: !!currentDb && !!currentTable,
  })

  const { data: indexes = [] } = useQuery({
    queryKey: ['indexes', currentDb, currentTable],
    queryFn: () => currentDb && currentTable ? api.tableIndexes(currentDb, currentTable) : Promise.resolve([]),
    enabled: !!currentDb && !!currentTable,
  })

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const toggleDatabase = (dbName: string) => {
    setExpandedDbs((prev) => {
      const next = new Set(prev)
      if (next.has(dbName)) {
        next.delete(dbName)
      } else {
        next.add(dbName)
      }
      return next
    })
  }

  const toggleTable = (tableKey: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev)
      if (next.has(tableKey)) {
        next.delete(tableKey)
      } else {
        next.add(tableKey)
      }
      return next
    })
  }

  const filteredDatabases = databases.filter((db) =>
    db.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getDbTabs = (dbName: string) => [
    { to: `/databases/${dbName}`, label: 'Structure' },
    { to: `/databases/${dbName}/sql`, label: 'SQL' },
    { to: `/databases/${dbName}/search`, label: 'Search' },
    { to: `/databases/${dbName}/query`, label: 'Query' },
    { to: `/databases/${dbName}/export`, label: 'Export' },
    { to: `/databases/${dbName}/import`, label: 'Import' },
    { to: `/databases/${dbName}/operations`, label: 'Operations' },
  ]

  const getTableTabs = (dbName: string, tableName: string) => [
    { to: `/tables/${dbName}/${tableName}/browse`, label: 'Browse' },
    { to: `/tables/${dbName}/${tableName}/structure`, label: 'Structure' },
    { to: `/tables/${dbName}/${tableName}/sql`, label: 'SQL' },
    { to: `/tables/${dbName}/${tableName}/search`, label: 'Search' },
    { to: `/tables/${dbName}/${tableName}/insert`, label: 'Insert' },
    { to: `/tables/${dbName}/${tableName}/export`, label: 'Export' },
    { to: `/tables/${dbName}/${tableName}/import`, label: 'Import' },
  ]

  const currentTabs = currentTable && currentDb
    ? getTableTabs(currentDb, currentTable)
    : currentDb
    ? getDbTabs(currentDb)
    : []

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-gray-100 border-r border-gray-300 transition-all duration-200 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-0'
        )}
      >
        <div className={cn('flex flex-col h-full', !sidebarOpen && 'hidden')}>
          {/* Header */}
          <div className="bg-gray-200 border-b border-gray-300 p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-gray-700" />
                <span className="font-semibold text-sm text-gray-800">OhMyAdmin</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-600 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-1 flex-wrap text-xs">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-6 px-2 text-xs',
                    location.pathname === '/' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 hover:bg-gray-300'
                  )}
                  title="Home"
                >
                  <Home className="h-3 w-3" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-700 hover:bg-gray-300"
                onClick={() => {
                  refetchDatabases()
                  if (currentDb) refetchTables()
                }}
                title="Reload navigation panel"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-700 hover:bg-gray-300"
                title="Navigation panel settings"
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-700 hover:bg-gray-300"
                title="phpMyAdmin documentation"
              >
                <Book className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-700 hover:bg-gray-300"
                title="MySQL documentation"
              >
                <HelpCircle className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-gray-700 hover:bg-gray-300"
                onClick={handleLogout}
                title="Log out"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Collapse/Expand All */}
          <div className="px-2 py-1 border-b border-gray-300 flex gap-2 text-xs">
            <button className="text-blue-600 hover:underline">Collapse all</button>
            <button className="text-blue-600 hover:underline">Expand all</button>
          </div>

          {/* Search */}
          <div className="p-2 border-b border-gray-300">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-500" />
              <Input
                placeholder="Escribe para filtrar estos, «Enter» para buscar todo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-6 pl-7 text-xs bg-white border-gray-300"
              />
            </div>
          </div>

          {/* Database Tree */}
          <nav className="flex-1 overflow-y-auto p-1">
            <div className="space-y-0">
              {filteredDatabases.map((database) => {
                const isExpanded = expandedDbs.has(database.name)
                const isCurrentDb = currentDb === database.name

                return (
                  <div key={database.name}>
                    <button
                      onClick={() => toggleDatabase(database.name)}
                      className={cn(
                        'w-full flex items-center gap-1 px-2 py-1 text-xs rounded hover:bg-gray-200 transition-colors',
                        isCurrentDb && 'bg-blue-100 text-blue-900 font-medium'
                      )}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-3 w-3 text-gray-500" />
                      )}
                      <Database className="h-3 w-3 text-gray-600" />
                      <span className="truncate flex-1 text-left">{database.name}</span>
                    </button>

                    {isExpanded && (
                      <div className="ml-3 mt-0 space-y-0">
                        {/* Database Tabs */}
                        {getDbTabs(database.name).map((tab) => (
                          <Link
                            key={tab.to}
                            to={tab.to}
                            className={cn(
                              'flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:bg-gray-200 transition-colors block',
                              location.pathname === tab.to && 'bg-blue-100 text-blue-900'
                            )}
                          >
                            <span>{tab.label}</span>
                          </Link>
                        ))}

                        {/* Tables */}
                        {isCurrentDb && filteredTables.length > 0 && (
                          <div className="mt-0">
                            {filteredTables.map((table) => {
                              const tableKey = `${database.name}.${table.name}`
                              const isTableExpanded = expandedTables.has(tableKey)
                              const isCurrentTable = currentTable === table.name

                              return (
                                <div key={table.name}>
                                  <button
                                    onClick={() => toggleTable(tableKey)}
                                    className={cn(
                                      'w-full flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:bg-gray-200 transition-colors',
                                      isCurrentTable && 'bg-blue-100 text-blue-900 font-medium'
                                    )}
                                  >
                                    {isTableExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-gray-500" />
                                    )}
                                    <Table className="h-3 w-3 text-gray-600" />
                                    <span className="truncate flex-1 text-left">{table.name}</span>
                                  </button>

                                  {isTableExpanded && isCurrentTable && (
                                    <div className="ml-3 mt-0 space-y-0">
                                      {/* Columns */}
                                      <div className="px-2 py-0.5 text-xs font-semibold text-gray-700 flex items-center gap-1">
                                        <Columns className="h-3 w-3" />
                                        Columns
                                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto p-0">
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      {columns.map((col) => (
                                        <div key={col.field} className="px-4 py-0.5 text-xs text-gray-600 truncate">
                                          {col.field} ({col.type}, {col.null === 'YES' ? 'nullable' : 'not null'})
                                        </div>
                                      ))}

                                      {/* Indexes */}
                                      <div className="px-2 py-0.5 text-xs font-semibold text-gray-700 flex items-center gap-1 mt-1">
                                        <Hash className="h-3 w-3" />
                                        Indexes
                                        <Button variant="ghost" size="icon" className="h-4 w-4 ml-auto p-0">
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      {indexes.map((idx) => (
                                        <div key={idx.key_name} className="px-4 py-0.5 text-xs text-gray-600 truncate">
                                          {idx.key_name}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-300 p-2 bg-gray-200">
            <div className="text-xs text-gray-600">
              <span className="font-medium">{user}</span>@localhost
            </div>
          </div>
        </div>
      </aside>

      {/* Toggle Button */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-2 left-2 z-50 h-8 w-8 bg-gray-200 border border-gray-300"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-4 w-4 text-gray-700" />
        </Button>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Server/Database Info Header */}
        {(currentDb || currentTable) && (
          <div className="bg-white border-b border-gray-300 px-4 py-2 text-xs">
            {currentTable && (
              <>
                <span className="text-gray-600">Servidor: </span>
                <span className="font-medium">mysql:3306</span>
                <span className="mx-2">→</span>
                <span className="text-gray-600">Base de datos: </span>
                <span className="font-medium">{currentDb}</span>
                <span className="mx-2">→</span>
                <span className="text-gray-600">Tabla: </span>
                <span className="font-medium">{currentTable}</span>
              </>
            )}
            {!currentTable && currentDb && (
              <>
                <span className="text-gray-600">Servidor: </span>
                <span className="font-medium">mysql:3306</span>
                <span className="mx-2">→</span>
                <span className="text-gray-600">Base de datos: </span>
                <span className="font-medium">{currentDb}</span>
              </>
            )}
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 p-3">
          <Outlet />
        </div>

        {/* SQL Console */}
        <div className="border-t border-gray-300 bg-gray-50 p-3">
          <div className="bg-white border border-gray-300 rounded">
            <div className="border-b border-gray-300 px-3 py-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">SQL Console</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-6 text-xs">
                  Options
                </Button>
              </div>
            </div>
            <div className="p-2">
              <Input
                placeholder="Execute queries in Enter and insert new line with Shift+Enter"
                className="text-xs bg-white border-gray-300"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
