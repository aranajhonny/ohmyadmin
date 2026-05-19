import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function ServerPrivilegesPage() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['server-privileges'],
    queryFn: () => api.privileges(),
  })

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
          <CardDescription>View MySQL user accounts and privileges</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <div>Loading...</div>}
          {error && <div className="text-destructive">Error loading users</div>}

          {users && (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Privileges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{user.user}</TableCell>
                      <TableCell className="font-mono text-sm">{user.host}</TableCell>
                      <TableCell className="text-sm">
                        {user.privileges.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.privileges.map((priv, privIndex) => (
                              <span
                                key={privIndex}
                                className="px-2 py-1 bg-secondary rounded text-xs"
                              >
                                {priv}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No privileges listed</span>
                        )}
                      </TableCell>
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
