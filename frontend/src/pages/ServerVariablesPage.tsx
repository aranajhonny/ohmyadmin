import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState } from 'react'

export default function ServerVariablesPage() {
  const [search, setSearch] = useState('')
  const { data: variables, isLoading, error } = useQuery({
    queryKey: ['server-variables'],
    queryFn: () => api.serverVariables(),
  })

  const filteredVariables = variables?.filter(v =>
    v.variable_name.toLowerCase().includes(search.toLowerCase()) ||
    v.value.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Server Variables</CardTitle>
          <CardDescription>View and search MySQL server variables</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading && <div>Loading...</div>}
          {error && <div className="text-destructive">Error loading variables</div>}

          {variables && (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variable Name</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVariables.map((variable, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{variable.variable_name}</TableCell>
                      <TableCell className="font-mono text-sm">{variable.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
