import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Download } from 'lucide-react'

export default function ExportPage() {
  const { db, table } = useParams()
  const [format, setFormat] = useState<'sql' | 'csv' | 'json' | 'xml'>('sql')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    setLoading(true)
    setError('')

    try {
      let content: string
      if (table) {
        content = await api.exportTable(db!, table!, format)
      } else {
        content = await api.exportDatabase(db!, format)
      }

      const filename = table ? `${table}.${format}` : `${db}.${format}`
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex gap-1 flex-wrap text-xs">
        <Link to={`/databases/${db}`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Structure
          </Button>
        </Link>
        <Link to={`/databases/${db}/sql`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            SQL
          </Button>
        </Link>
        <Link to={`/databases/${db}/search`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Search
          </Button>
        </Link>
        <Link to={`/databases/${db}/query`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Consulta
          </Button>
        </Link>
        <Link to={`/databases/${db}/export`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
            Export
          </Button>
        </Link>
        <Link to={`/databases/${db}/import`}>
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

      {/* Database Info */}
      <div className="bg-white border border-gray-300 rounded p-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{table ? `Table: ${table}` : `Database: ${db}`}</span>
        </div>
      </div>

      {/* Export Options */}
      <Card className="border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Export {table ? 'table' : 'database'}</span>
        </div>
        <CardContent className="p-3 space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Export format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'sql' | 'csv' | 'json' | 'xml')}
              className="flex h-8 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <option value="sql">SQL</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-2 rounded text-xs">
              {error}
            </div>
          )}

          <Button onClick={handleExport} disabled={loading} className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
            <Download className="mr-1 h-3 w-3" />
            {loading ? 'Exporting...' : 'Export'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
