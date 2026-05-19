import { Link, useParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Database, Save } from 'lucide-react'

export default function DatabaseOperationsPage() {
  const { db: dbName } = useParams()

  return (
    <div className="space-y-3">
      {/* Action Bar */}
      <div className="flex gap-1 flex-wrap text-xs">
        <Link to={`/databases/${dbName}`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Structure
          </Button>
        </Link>
        <Link to={`/databases/${dbName}/sql`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            SQL
          </Button>
        </Link>
        <Link to={`/databases/${dbName}/search`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Search
          </Button>
        </Link>
        <Link to={`/databases/${dbName}/query`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Query
          </Button>
        </Link>
        <Link to={`/databases/${dbName}/export`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Export
          </Button>
        </Link>
        <Link to={`/databases/${dbName}/import`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
            Import
          </Button>
        </Link>
        <Link to={`/databases/${dbName}/operations`}>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs bg-blue-600 text-white border-blue-600">
            Operations
          </Button>
        </Link>
      </div>

      {/* Database Info */}
      <div className="bg-white border border-gray-300 rounded p-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Database: {dbName}</span>
        </div>
      </div>

      {/* Rename Database */}
      <Card className="border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Rename database</span>
        </div>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Input defaultValue={dbName} className="h-8 text-xs bg-white border-gray-300 flex-1" />
            <Button className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Save className="h-3 w-3 mr-1" />
              Go
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Collation */}
      <Card className="border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Collation</span>
        </div>
        <CardContent className="p-3">
          <select className="w-full h-8 px-2 text-xs bg-white border border-gray-300 rounded">
            <option>utf8mb4_general_ci</option>
            <option>utf8mb4_unicode_ci</option>
            <option>latin1_swedish_ci</option>
          </select>
        </CardContent>
      </Card>

      {/* Create Table */}
      <Card className="border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Create new table on database {dbName}</span>
        </div>
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Input placeholder="Table name" className="h-8 text-xs bg-white border-gray-300 flex-1" />
            <Input placeholder="Number of columns" type="number" defaultValue="4" className="h-8 text-xs bg-white border-gray-300 w-32" />
            <Button className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">
              <Database className="h-3 w-3 mr-1" />
              Go
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Drop Database */}
      <Card className="border-gray-300">
        <div className="bg-gray-50 border-b border-gray-300 px-3 py-2">
          <span className="text-xs font-semibold text-gray-700">Drop the database (DROP)</span>
        </div>
        <CardContent className="p-3">
          <Button variant="destructive" className="h-8 text-xs">
            Drop database
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
