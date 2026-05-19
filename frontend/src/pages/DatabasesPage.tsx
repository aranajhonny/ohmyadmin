import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Database, Plus, Trash2, Loader2, Upload, ChevronRight } from 'lucide-react'

export default function DatabasesPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [newDbName, setNewDbName] = useState('')

  const { data: databases, isLoading } = useQuery({
    queryKey: ['databases'],
    queryFn: api.listDatabases,
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => api.createDatabase(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
      setNewDbName('')
    },
  })

  const dropMutation = useMutation({
    mutationFn: (name: string) => api.dropDatabase(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] })
    },
  })

  const goToImport = () => {
    navigate('/import')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-gray-600" />
        <span className="text-gray-600 text-sm">Loading databases...</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-800">Databases</h1>
        <Button
          onClick={goToImport}
          className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          Import
        </Button>
      </div>

      {/* Create Database */}
      <Card className="border-gray-300">
        <CardHeader className="pb-2 bg-gray-50 border-b border-gray-300">
          <CardTitle className="text-sm font-semibold text-gray-800">Create Database</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (newDbName.trim()) createMutation.mutate(newDbName.trim())
            }}
            className="flex gap-2"
          >
            <Input
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              placeholder="Database name"
              className="h-8 text-xs bg-white border-gray-300 max-w-xs"
            />
            <Button
              type="submit"
              disabled={createMutation.isPending || !newDbName.trim()}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Plus className="h-3 w-3 mr-1" />
              )}
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Databases Table */}
      <Card className="border-gray-300">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-300">
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Database</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Collation</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Tables</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8">Size</TableHead>
                <TableHead className="text-xs font-semibold text-gray-700 h-8 w-16">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {databases?.map((db) => (
                <TableRow key={db.name} className="border-b border-gray-200 hover:bg-gray-50">
                  <TableCell className="py-2">
                    <Link
                      to={`/databases/${db.name}`}
                      className="flex items-center gap-2 text-blue-600 hover:underline text-xs font-medium"
                    >
                      <Database className="h-3 w-3 text-gray-600" />
                      {db.name}
                      <ChevronRight className="h-3 w-3 text-gray-400 ml-auto" />
                    </Link>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-600">
                    {db.collation || '—'}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-600">
                    {db.statistics?.tables || 0}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-600">
                    {db.statistics?.total_length
                      ? `${(db.statistics.total_length / 1024 / 1024).toFixed(2)} MB`
                      : '—'}
                  </TableCell>
                  <TableCell className="py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dropMutation.mutate(db.name)}
                      disabled={dropMutation.isPending || db.is_system}
                      className="h-6 w-6 hover:bg-red-50"
                      title={db.is_system ? 'Cannot drop system database' : 'Drop database'}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!databases || databases.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-600 py-8 text-xs">
                    No databases found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="text-xs text-gray-600">
        Total databases: <span className="font-medium">{databases?.length || 0}</span>
      </div>
    </div>
  )
}
