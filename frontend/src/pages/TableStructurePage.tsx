import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, Table2, Plus, Trash2, Rows3, Terminal } from 'lucide-react'
import type { ForeignKey } from '@/types'

export default function TableStructurePage() {
  const { db, table } = useParams<{ db: string; table: string }>()
  const queryClient = useQueryClient()

  const { data: columns, isLoading: colsLoading } = useQuery({
    queryKey: ['tableColumns', db, table],
    queryFn: () => api.tableColumns(db!, table!),
    enabled: !!db && !!table,
  })

  const { data: indexes, isLoading: idxLoading } = useQuery({
    queryKey: ['tableIndexes', db, table],
    queryFn: () => api.tableIndexes(db!, table!),
    enabled: !!db && !!table,
  })

  const { data: foreignKeys, isLoading: fkLoading } = useQuery({
    queryKey: ['foreignKeys', db, table],
    queryFn: () => api.tableForeignKeys(db!, table!),
    enabled: !!db && !!table,
  })

  const deleteFkMutation = useMutation({
    mutationFn: async (constraintName: string) => {
      await fetch(`/api/databases/${db}/tables/${table}/foreign-keys/${constraintName}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foreignKeys', db, table] })
    },
  })

  const handleDeleteFk = (constraintName: string) => {
    if (confirm(`Are you sure you want to delete foreign key "${constraintName}"?`)) {
      deleteFkMutation.mutate(constraintName)
    }
  }

  if (colsLoading || idxLoading || fkLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-600" />
        <span className="text-gray-600 text-sm">Loading structure...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex gap-1 flex-wrap text-xs">
        <Link to={`/tables/${db}/${table}/browse`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Examinar
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/structure`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
            Estructura
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/sql`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            SQL
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/search`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Buscar
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/insert`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Insertar
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/export`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Exportar
          </Button>
        </Link>
        <Link to={`/tables/${db}/${table}/import`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Importar
          </Button>
        </Link>
      </div>

      {/* Table Info */}
      <div className="bg-white border border-gray-300 rounded p-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Tabla: {table}</span>
        </div>
      </div>

      {/* Columns */}
      <Card className="border-gray-300">
        <CardContent className="p-0">
          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Columnas</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:bg-gray-100" title="Nueva columna">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Name</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Type</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Collation</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Constraint</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Null</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Default</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Extra</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {columns?.map((col) => (
                <TableRow key={col.field} className="border-b border-gray-200 hover:bg-blue-50">
                  <TableCell className="p-2 text-xs font-medium">{col.field}</TableCell>
                  <TableCell className="p-2 text-xs">
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded border border-gray-300">
                      {col.type}
                    </code>
                  </TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{col.collation || '—'}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{col.extra || '—'}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{col.null}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">
                    {col.default !== null ? col.default : <span className="italic">NULL</span>}
                  </TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{col.extra || '—'}</TableCell>
                  <TableCell className="p-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:bg-blue-50" title="Editar">
                        <Table2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:bg-red-50" title="Borrar">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Indexes */}
      <Card className="border-gray-300">
        <CardContent className="p-0">
          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Indexes</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:bg-gray-100" title="New index">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Name</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Type</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Unique</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Column</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Cardinality</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Collation</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indexes?.map((idx, i) => (
                <TableRow key={i} className="border-b border-gray-200 hover:bg-blue-50">
                  <TableCell className="p-2 text-xs font-medium">{idx.key_name}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{idx.index_type}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{!idx.non_unique ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{idx.column_name}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{idx.cardinality}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{idx.collation || '—'}</TableCell>
                  <TableCell className="p-2">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:bg-blue-50" title="Editar">
                        <Table2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:bg-red-50" title="Borrar">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!indexes || indexes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-600 py-8 text-xs">
                    No indexes defined
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Foreign Keys */}
      <Card className="border-gray-300">
        <CardContent className="p-0">
          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Foreign Keys</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-600 hover:bg-gray-100" title="New foreign key">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 border-b border-gray-300">
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Constraint</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Column</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Referenced table</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Referenced column</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">On delete</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">On update</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foreignKeys?.map((fk: ForeignKey, i: number) => (
                <TableRow key={i} className="border-b border-gray-200 hover:bg-blue-50">
                  <TableCell className="p-2 text-xs font-medium">{fk.constraint_name}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{fk.column_name}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{fk.referenced_table}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{fk.referenced_column}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{fk.on_delete || '—'}</TableCell>
                  <TableCell className="p-2 text-xs text-gray-600">{fk.on_update || '—'}</TableCell>
                  <TableCell className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteFk(fk.constraint_name)}
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!foreignKeys || foreignKeys.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-600 py-8 text-xs">
                    No foreign keys defined
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
