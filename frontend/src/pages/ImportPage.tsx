import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, Loader2 } from 'lucide-react'

export default function ImportPage() {
  const { db, table } = useParams()
  const [customDbName, setCustomDbName] = useState('')
  const [sqlContent, setSqlContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleImport = async () => {
    const targetDb = db || customDbName

    if (!targetDb?.trim()) {
      setError('Por favor, ingrese un nombre de base de datos')
      return
    }

    if (!sqlContent.trim()) {
      setError('Por favor, ingrese contenido SQL para importar')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (table) {
        await api.importTable(targetDb, table, sqlContent)
      } else {
        await api.importDatabase(targetDb, sqlContent)
      }
      setSuccess(true)
      setSqlContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSqlContent(event.target?.result as string)
      }
      reader.readAsText(file)
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
            Query
          </Button>
        </Link>
        <Link to={`/databases/${db}/export`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Export
          </Button>
        </Link>
        <Link to={`/databases/${db}/import`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
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

      {/* Import Options */}
      <Card className="border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Import {table ? 'table' : 'database'}</span>
        </div>
        <CardContent className="p-3 space-y-3">
          {!db && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Database name</label>
              <Input
                value={customDbName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomDbName(e.target.value)}
                placeholder="Enter database name"
                className="h-8 text-xs bg-white border-gray-300"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Upload SQL file</label>
            <input
              type="file"
              accept=".sql"
              onChange={handleFileUpload}
              className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700">Or paste SQL content</label>
            <Textarea
              value={sqlContent}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSqlContent(e.target.value)}
              placeholder="Paste your SQL statements here..."
              className="min-h-[200px] font-mono text-xs bg-white border-gray-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-2 rounded text-xs">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 border border-green-200 p-2 rounded text-xs">
              Import successful!
            </div>
          )}

          <Button onClick={handleImport} disabled={loading} className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
            {loading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-1 h-3 w-3" />
                Import
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
