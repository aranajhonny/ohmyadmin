import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Database, Server, Activity, Clock, ChevronRight } from 'lucide-react'

export default function HomePage() {
  const { data: serverInfo, isLoading, error } = useQuery({
    queryKey: ['serverInfo'],
    queryFn: api.serverInfo,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 text-sm">Loading server information...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded p-3 text-sm">
        Failed to load server info: {error.message}
      </div>
    )
  }

  const quickLinks = [
    { to: '/databases', label: 'Databases', icon: Database },
    { to: '/server/variables', label: 'Variables', icon: Server },
    { to: '/server/status', label: 'Status', icon: Activity },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-300 rounded p-3">
        <h1 className="text-lg font-semibold text-gray-800">Server: localhost</h1>
        <div className="text-xs text-gray-600 mt-1">
          <span className="font-medium">MySQL</span> {serverInfo?.version || 'Unknown'}
          {serverInfo?.is_maria_db && ' (MariaDB)'}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-2">
        {quickLinks.map((link) => (
          <Link key={link.to} to={link.to}>
            <Button
              variant="outline"
              className="w-full justify-start h-9 bg-white border-gray-300 hover:bg-gray-50 text-gray-700 text-xs"
            >
              <link.icon className="h-4 w-4 mr-2 text-gray-600" />
              {link.label}
              <ChevronRight className="h-3 w-3 ml-auto text-gray-400" />
            </Button>
          </Link>
        ))}
      </div>

      {/* Server Information */}
      <Card className="border-gray-300">
        <CardHeader className="pb-3 bg-gray-50 border-b border-gray-300">
          <CardTitle className="text-sm font-semibold text-gray-800">Server Information</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Database Server</span>
              <span className="font-medium text-gray-800">
                {serverInfo?.is_maria_db ? 'MariaDB' : 'MySQL'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Server Version</span>
              <span className="font-medium text-gray-800">{serverInfo?.version || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Protocol Version</span>
              <span className="font-medium text-gray-800">{serverInfo?.version_int || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Character Set</span>
              <span className="font-medium text-gray-800">{serverInfo?.charset || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Collation</span>
              <span className="font-medium text-gray-800">{serverInfo?.collation || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Uptime</span>
              <span className="font-medium text-gray-800">{serverInfo?.uptime || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Statistics */}
      <Card className="border-gray-300">
        <CardHeader className="pb-3 bg-gray-50 border-b border-gray-300">
          <CardTitle className="text-sm font-semibold text-gray-800">Server Statistics</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Connections</span>
              <span className="font-medium text-gray-800">{serverInfo?.connections || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Questions</span>
              <span className="font-medium text-gray-800">{serverInfo?.questions || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Slow Queries</span>
              <span className="font-medium text-gray-800">{serverInfo?.slow_queries || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Open Tables</span>
              <span className="font-medium text-gray-800">{serverInfo?.open_tables || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Flush Commands</span>
              <span className="font-medium text-gray-800">{serverInfo?.flush_commands || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Web Server */}
      <Card className="border-gray-300">
        <CardHeader className="pb-3 bg-gray-50 border-b border-gray-300">
          <CardTitle className="text-sm font-semibold text-gray-800">Web Server</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="text-xs text-gray-700">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">OhMyAdmin Version</span>
              <span className="font-medium text-gray-800">5.0.0 (React)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600">Database Client</span>
              <span className="font-medium text-gray-800">Go Driver</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
