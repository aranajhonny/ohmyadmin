import { useQuery } from '@tanstack/react-query'
import { Link, useParams, useNavigate } from 'react-router-dom'
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
import { Table2, Terminal, Loader2, Rows3, Plus, Database } from 'lucide-react'

export default function DatabaseStructurePage() {
  const { db } = useParams<{ db: string }>()
  const navigate = useNavigate()

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables', db],
    queryFn: () => api.listTables(db!),
    enabled: !!db,
  })

  const goToCreateTable = () => {
    navigate(`/databases/${db}/sql`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-600" />
        <span className="text-gray-600 text-sm">Loading tables...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex gap-1 flex-wrap text-xs">
        <Link to={`/databases/${db}`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Estructura
          </Button>
        </Link>
        <Link to={`/databases/${db}/sql`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            SQL
          </Button>
        </Link>
        <Link to={`/databases/${db}/search`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Buscar
          </Button>
        </Link>
        <Link to={`/databases/${db}/query`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Consulta
          </Button>
        </Link>
        <Link to={`/databases/${db}/export`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Exportar
          </Button>
        </Link>
        <Link to={`/databases/${db}/import`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Importar
          </Button>
        </Link>
        <Link to={`/databases/${db}/operations`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Operations
          </Button>
        </Link>
      </div>

      {/* Database Info */}
      <div className="bg-white border border-gray-300 rounded p-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Database: {db}</span>
        </div>
      </div>

      {/* Create Table */}
      <Card className="border-gray-300">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Input placeholder="Table name" className="h-8 text-xs bg-white border-gray-300 flex-1" />
            <Input placeholder="Number of columns" type="number" defaultValue="4" className="h-8 text-xs bg-white border-gray-300 w-32" />
            <Button onClick={goToCreateTable} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tables Table */}
      <Card className="border-gray-300">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Table</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Actions</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Rows</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Type</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables?.map((table) => {
                const totalSize = table.data_length + table.index_length
                const sizeStr = totalSize > 1024 * 1024
                  ? (totalSize / (1024 * 1024)).toFixed(2) + ' MiB'
                  : totalSize > 1024
                    ? (totalSize / 1024).toFixed(2) + ' KiB'
                    : totalSize + ' B'

                return (
                  <TableRow key={table.name} className="border-b border-gray-200 hover:bg-blue-50">
                    <TableCell className="p-2">
                      <Link
                        to={`/tables/${db}/${table.name}/browse`}
                        className="flex items-center gap-2 text-blue-600 hover:underline text-xs font-medium"
                      >
                        <Table2 className="h-3 w-3 text-gray-600" />
                        {table.name}
                      </Link>
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex gap-1">
                        <Link to={`/tables/${db}/${table.name}/browse`}>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:bg-blue-50" title="Examinar">
                            <Rows3 className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link to={`/tables/${db}/${table.name}/structure`}>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:bg-gray-100" title="Estructura">
                            <Table2 className="h-3 w-3" />
                          </Button>
                        </Link>
                        <Link to={`/tables/${db}/${table.name}/sql`}>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:bg-gray-100" title="SQL">
                            <Terminal className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 text-xs text-gray-600">{table.rows.toLocaleString()}</TableCell>
                    <TableCell className="p-2 text-xs text-gray-600">{table.type}</TableCell>
                    <TableCell className="p-2 text-xs text-gray-600">{sizeStr}</TableCell>
                  </TableRow>
                )
              })}
              {(!tables || tables.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-600 py-8 text-xs">
                    No tables found in this database
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="text-xs text-gray-600">
        Total tables: <span className="font-medium">{tables?.length || 0}</span>
      </div>
    </div>
  )
}
