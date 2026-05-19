import { useState, useCallback } from 'react'
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
import {
  Play,
  Loader2,
  Wand2,
  Plus,
  FileText,
} from 'lucide-react'
import Editor from '@monaco-editor/react'

export default function SQLEditorPage() {
  const { db, table } = useParams<{ db: string; table?: string }>()
  const [query, setQuery] = useState('SELECT *')
  const [result, setResult] = useState<any>(null)
  const [formatting, setFormatting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const runQuery = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await api.executeSQL(query, db)
      if (res.success) {
        setResult(res)
      } else {
        setError(res.error || 'Query failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed')
    } finally {
      setLoading(false)
    }
  }, [query, db])

  const formatQuery = useCallback(async () => {
    if (!query.trim()) return
    setFormatting(true)
    setError('')

    try {
      const res = await api.formatSQL(query)
      setQuery(res.formatted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SQL formatting failed')
    } finally {
      setFormatting(false)
    }
  }, [query])

  const insertCreateTable = useCallback(() => {
    const createTableSQL = `CREATE TABLE \`table_name\` (
  \`id\` INT NOT NULL AUTO_INCREMENT,
  \`name\` VARCHAR(255) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
    setQuery(createTableSQL)
  }, [])

  const insertInsertSQL = useCallback(() => {
    const insertSQL = `INSERT INTO \`table_name\` (\`name\`) 
VALUES ('example value');`
    setQuery(insertSQL)
  }, [])

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
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
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
            Operaciones
          </Button>
        </Link>
      </div>

      {/* Database Info */}
      <div className="bg-white border border-gray-300 rounded p-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{table ? `Tabla: ${table}` : `Base de datos: ${db}`}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-gray-300">
        <CardContent className="p-3">
          <div className="flex gap-2 flex-wrap text-xs">
            <Button onClick={insertCreateTable} variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              <Plus className="h-3 w-3 mr-1" />
              Crear tabla
            </Button>
            <Button onClick={insertInsertSQL} variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              <FileText className="h-3 w-3 mr-1" />
              Insertar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SQL Editor */}
      <Card className="border-gray-300">
        <CardContent className="p-0">
          <div className="border-b border-gray-300 bg-gray-50 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Editor SQL</span>
          </div>
          <div className="border border-gray-200" style={{ height: '400px' }}>
            <Editor
              height="100%"
              defaultLanguage="sql"
              theme="vs"
              value={query}
              onChange={(val) => setQuery(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                lineDecorationsWidth: 10,
                renderLineHighlight: 'all',
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                },
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: false,
                },
              }}
            />
          </div>
          <div className="flex items-center justify-between p-3 border-t border-gray-300 bg-gray-50">
            <div className="flex items-center gap-2">
              <Button onClick={runQuery} disabled={loading || !query.trim()} className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                Ejecutar
              </Button>
              <Button onClick={formatQuery} disabled={formatting || !query.trim()} variant="outline" className="h-7 px-3 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                {formatting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <Wand2 className="h-3 w-3 mr-1" />
                )}
                Formatear
              </Button>
            </div>
            {result && (
              <div className="text-xs text-gray-600">
                {result.message}
                {result.query_time && ` (${result.query_time.toFixed(4)}s)`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3 text-xs">
          {error}
        </div>
      )}

      {result && result.columns && result.rows && (
        <Card className="border-gray-300">
          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
            <span className="text-xs font-semibold text-gray-700">Resultados de la consulta</span>
          </div>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 border-b border-gray-300">
                  {result.columns.map((col: any, i: number) => (
                    <TableHead key={i} className="text-xs font-semibold text-gray-700 h-8 whitespace-nowrap">
                      {col.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.map((row: any, i: number) => (
                  <TableRow key={i} className="border-b border-gray-200 hover:bg-blue-50">
                    {result.columns.map((col: any, j: number) => (
                      <TableCell key={j} className="p-2 text-xs max-w-xs truncate" title={formatCellValue(row[col.name])}>
                        {formatCellValue(row[col.name])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {result.rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={result.columns.length}
                      className="text-center text-gray-600 py-8 text-xs"
                    >
                      The query returned no rows
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {result && result.affected_rows !== undefined && (
        <Card className="border-gray-300">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">{result.affected_rows} fila(s) afectadas</span>
              <span>en {result.query_time.toFixed(4)}s</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatCellValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}
