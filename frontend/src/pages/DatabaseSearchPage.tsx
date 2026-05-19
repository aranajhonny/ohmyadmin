import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Table2 } from 'lucide-react'

interface SearchResult {
  type: 'table' | 'column' | 'view'
  database: string
  table?: string
  column?: string
  view?: string
}

export default function DatabaseSearchPage() {
  const { db } = useParams<{ db: string }>()
  const [searchTerm, setSearchTerm] = useState('')

  const { data: tables } = useQuery({
    queryKey: ['tables', db],
    queryFn: () => api.listTables(db || ''),
    enabled: !!db,
  })

  const handleSearch = () => {
    if (!searchTerm || !db) return
  }

  const results: SearchResult[] = []
  if (tables && searchTerm) {
    const term = searchTerm.toLowerCase()
    tables.forEach(table => {
      if (table.name.toLowerCase().includes(term)) {
        results.push({
          type: 'table',
          database: db || '',
          table: table.name,
        })
      }
    })
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
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
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
          <span className="font-medium">Database: {db}</span>
        </div>
      </div>

      {/* Search Box */}
      <Card className="border-gray-300">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                placeholder="Search in database"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8 h-8 text-xs bg-white border-gray-300"
              />
            </div>
            <Button onClick={handleSearch} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Search className="w-3 h-3 mr-1" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchTerm && (
        <Card className="border-gray-300">
          <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
            <span className="text-xs font-semibold text-gray-700">
              Search results for "{searchTerm}"
            </span>
          </div>
          <CardContent className="p-0">
            {results.length === 0 ? (
              <div className="text-center text-gray-600 py-8 text-xs">
                No results found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {results.map((result, index) => (
                  <Link
                    key={index}
                    to={`/tables/${db}/${result.table}/browse`}
                    className="block hover:bg-blue-50"
                  >
                    <div className="p-3 flex items-center gap-3">
                      <Table2 className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs font-medium text-gray-700">{result.table || result.view}</div>
                        <div className="text-xs text-gray-500">
                          {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
