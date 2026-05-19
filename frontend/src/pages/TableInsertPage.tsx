import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Plus } from 'lucide-react'

export default function TableInsertPage() {
  const { db, table } = useParams<{ db: string; table: string }>()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { data: columns, isLoading } = useQuery({
    queryKey: ['tableColumns', db, table],
    queryFn: () => api.tableColumns(db!, table!),
    enabled: !!db && !!table,
  })

  const insertMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await api.insertRow(db!, table!, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tableData', db, table] })
      setFormData({})
      setError('')
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Insert failed')
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await insertMutation.mutateAsync(formData)
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-600" />
        <span className="text-gray-600 text-sm">Loading columns...</span>
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
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
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
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
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

      {/* Insert Form */}
      <Card className="border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Insertar nueva fila</span>
        </div>
        <CardContent className="p-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            {columns?.map((col) => (
              <div key={col.field} className="space-y-1">
                <label className="text-xs font-medium text-gray-700">
                  {col.field}
                  <span className="text-gray-500 font-normal ml-2">({col.type})</span>
                  {col.null === 'NO' && <span className="text-red-600 font-normal ml-1">*</span>}
                </label>
                <Input
                  type={col.type.toLowerCase().includes('int') ? 'number' : 'text'}
                  value={formData[col.field] || ''}
                  onChange={(e) => setFormData({ ...formData, [col.field]: e.target.value })}
                  className="h-8 text-xs bg-white border-gray-300"
                  required={col.null === 'NO'}
                />
              </div>
            ))}

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-2 rounded text-xs">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
                {loading ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Insertando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-3 w-3" />
                    Insertar
                  </>
                )}
              </Button>
              <Link to={`/tables/${db}/${table}/browse`}>
                <Button type="button" variant="outline" className="h-8 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 text-xs">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
