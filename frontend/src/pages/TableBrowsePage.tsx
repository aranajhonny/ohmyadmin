import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Edit,
  Copy,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react'

export default function TableBrowsePage() {
  const { db, table } = useParams<{ db: string; table: string }>()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const perPageOptions = [25, 50, 100, 250, 500]

  const { data, isLoading, error } = useQuery({
    queryKey: ['tableData', db, table, page, perPage, sortBy, sortOrder, search],
    queryFn: () =>
      api.tableData(db!, table!, {
        page,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: search || undefined,
      }),
    enabled: !!db && !!table,
  })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortOrder('ASC')
    }
  }

  const toggleRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleAllRows = () => {
    if (selectedRows.size === data?.rows.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(data?.rows.map((_, i) => i) || []))
    }
  }

  const totalPages = data ? Math.ceil(data.total_rows / data.per_page) : 0
  const startRow = data ? (page - 1) * perPage + 1 : 0
  const endRow = data ? Math.min(page * perPage, data.total_rows) : 0

  return (
    <div className="space-y-3">
      {/* Table Info Header */}
      <div className="bg-white border border-gray-300 rounded p-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{table}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {data?.comment || 'Table description'}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex gap-1 flex-wrap text-xs">
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
          Browse
        </Button>
        <Link to={`/tables/${db}/${table}/structure`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Structure
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/sql`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            SQL
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/search`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Search
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/insert`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Insert
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/export`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Export
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/import`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Import
          </Button>
        </Link>
        <Link to={`/databases/${db}/operations`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Operations
          </Button>
        </Link>
      </div>

      {/* Pagination Info */}
      <div className="text-xs text-gray-600">
        Showing rows {startRow} - {endRow} (total of {data?.total_rows || 0}, query took {data?.query_time.toFixed(4) || 0} seconds.)
      </div>

      {/* SQL Query */}
      <div className="bg-gray-50 border border-gray-300 rounded p-2 text-xs font-mono text-gray-700">
        SELECT * FROM `{table}`
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap text-xs">
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
          Edit inline
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
          Edit
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
          Explain SQL
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
          Create PHP code
        </Button>
        <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
          Update
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Show all</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">Number of rows:</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
            className="h-7 px-2 text-xs bg-white border border-gray-300 rounded"
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Filter rows:</span>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search..."
            className="h-7 text-xs bg-white border-gray-300 w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Sort by key:</span>
          <span className="text-gray-700">None</span>
        </div>
      </div>

      {/* Data Table */}
      <Card className="border-gray-300">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-600" />
              <span className="text-gray-600 text-sm">Loading data...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
              Error: {(error as Error).message}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b border-gray-300">
                    <TableHead className="w-8 h-8 text-xs p-2">
                      <button onClick={toggleAllRows} className="hover:bg-gray-200 rounded">
                        {selectedRows.size === data?.rows.length ? (
                          <CheckSquare className="h-3 w-3" />
                        ) : (
                          <Square className="h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    {data?.columns.map((col) => (
                      <TableHead
                        key={col.field}
                        className="cursor-pointer whitespace-nowrap h-8 text-xs font-semibold text-gray-700 p-2"
                        onClick={() => handleSort(col.field)}
                        title={col.comment || `${col.field} (${col.type})`}
                      >
                        <div className="flex items-center gap-1">
                          {col.field}
                          {sortBy === col.field && (
                            <span className="text-gray-500">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-24 h-8 text-xs p-2">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.rows.map((row, i) => (
                    <TableRow key={i} className="border-b border-gray-200 hover:bg-blue-50">
                      <TableCell className="p-2">
                        <button onClick={() => toggleRow(i)} className="hover:bg-gray-200 rounded">
                          {selectedRows.has(i) ? (
                            <CheckSquare className="h-3 w-3" />
                          ) : (
                            <Square className="h-3 w-3" />
                          )}
                        </button>
                      </TableCell>
                      {data.columns.map((col) => (
                        <TableCell key={col.field} className="p-2 text-xs max-w-xs truncate" title={formatValue(row[col.field])}>
                          {formatValue(row[col.field])}
                        </TableCell>
                      ))}
                      <TableCell className="p-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:bg-blue-50" title="Editar">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:bg-gray-100" title="Copiar">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:bg-red-50" title="Borrar">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data?.rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={data?.columns.length + 2 || 2}
                        className="text-center text-gray-600 py-8 text-xs"
                      >
                        No data found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page <= 1}
            className="h-7 px-2 text-xs bg-white border-gray-300"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Primero
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-7 px-2 text-xs bg-white border-gray-300"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Previous
          </Button>
          <span className="text-gray-600 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="h-7 px-2 text-xs bg-white border-gray-300"
          >
            Next
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="h-7 px-2 text-xs bg-white border-gray-300"
          >
            Last
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        <div className="text-gray-600">
          {selectedRows.size > 0 && `${selectedRows.size} rows selected`}
        </div>
      </div>
    </div>
  )
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
