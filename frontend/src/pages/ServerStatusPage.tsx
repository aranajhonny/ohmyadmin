import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState } from 'react'

export default function ServerStatusPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('status')
  const { data: status, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['server-status'],
    queryFn: () => api.serverStatus(),
  })
  const { data: processes, isLoading: processesLoading, error: processesError } = useQuery({
    queryKey: ['process-list'],
    queryFn: () => api.processList(),
  })

  const filteredStatus = status?.filter(s =>
    s.variable_name.toLowerCase().includes(search.toLowerCase()) ||
    s.value.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto py-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'status'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          }`}
        >
          Status Variables
        </button>
        <button
          onClick={() => setActiveTab('processes')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            activeTab === 'processes'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/50'
          }`}
        >
          Process List
        </button>
      </div>

      {activeTab === 'status' && (
        <Card>
          <CardHeader>
            <CardTitle>Server Status</CardTitle>
            <CardDescription>View MySQL server status variables</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {statusLoading && <div>Loading...</div>}
            {statusError && <div className="text-destructive">Error loading status</div>}

            {status && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable Name</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStatus.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">{item.variable_name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'processes' && (
        <Card>
          <CardHeader>
            <CardTitle>Process List</CardTitle>
            <CardDescription>View active MySQL processes</CardDescription>
          </CardHeader>
          <CardContent>
            {processesLoading && <div>Loading...</div>}
            {processesError && <div className="text-destructive">Error loading processes</div>}

            {processes && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Database</TableHead>
                      <TableHead>Command</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processes.map((process) => (
                      <TableRow key={process.id}>
                        <TableCell className="font-mono text-sm">{process.id}</TableCell>
                        <TableCell className="font-mono text-sm">{process.user}</TableCell>
                        <TableCell className="font-mono text-sm">{process.host}</TableCell>
                        <TableCell className="font-mono text-sm">{process.db}</TableCell>
                        <TableCell className="font-mono text-sm">{process.command}</TableCell>
                        <TableCell className="font-mono text-sm">{process.time}</TableCell>
                        <TableCell className="font-mono text-sm">{process.state}</TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">{process.info}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
