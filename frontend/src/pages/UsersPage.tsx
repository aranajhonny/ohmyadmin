import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Plus, Trash2, Edit, User } from 'lucide-react'

interface MySQLUser {
  host: string
  user: string
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({ user: '', host: '%', password: '' })

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/server/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (user: { user: string; host: string; password: string }) => {
      await fetch('/api/server/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(user),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsCreateModalOpen(false)
      setNewUser({ user: '', host: '%', password: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async ({ user, host }: { user: string; host: string }) => {
      await fetch(`/api/server/users/${user}/${encodeURIComponent(host)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const handleCreate = () => {
    if (newUser.user && newUser.password) {
      createMutation.mutate(newUser)
    }
  }

  const handleDelete = (user: string, host: string) => {
    if (confirm(`Are you sure you want to delete user "${user}@${host}"?`)) {
      deleteMutation.mutate({ user, host })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            User Accounts
          </h1>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {isCreateModalOpen && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Username</label>
                  <Input
                    value={newUser.user}
                    onChange={(e) => setNewUser({ ...newUser, user: e.target.value })}
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Host</label>
                  <Input
                    value={newUser.host}
                    onChange={(e) => setNewUser({ ...newUser, host: e.target.value })}
                    placeholder="% for any host"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate}>Create User</Button>
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users && users.length > 0 ? (
                  users.map((u: MySQLUser, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{u.user}</TableCell>
                      <TableCell>{u.host}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(u.user, u.host)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
