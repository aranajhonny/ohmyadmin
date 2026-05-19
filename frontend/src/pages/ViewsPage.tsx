import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Plus, Trash2, Edit, Eye } from 'lucide-react'

interface View {
  name: string
  database: string
  definition: string
  check_option: string
  is_updatable: string
}

export default function ViewsPage() {
  const { db } = useParams<{ db: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedView, setSelectedView] = useState<View | null>(null)

  const { data: views, isLoading } = useQuery({
    queryKey: ['views', db],
    queryFn: async () => {
      const response = await fetch(`/api/databases/${db}/views`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      return response.json()
    },
    enabled: !!db,
  })

  const deleteMutation = useMutation({
    mutationFn: async (viewName: string) => {
      await fetch(`/api/databases/${db}/views/${viewName}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views', db] })
    },
  })

  const handleDelete = (viewName: string) => {
    if (confirm(`Are you sure you want to delete view "${viewName}"?`)) {
      deleteMutation.mutate(viewName)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/databases/${db}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Views: {db}</h1>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create View
          </Button>
        </div>

        {isLoading ? (
          <div>Loading...</div>
        ) : views && views.length > 0 ? (
          <div className="grid gap-4">
            {views.map((view: View) => (
              <Card key={view.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      {view.name}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(view.name)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Drop
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Definition:</span>
                      <code className="block mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {view.definition}
                      </code>
                    </div>
                    <div className="text-sm text-gray-500">
                      Updatable: {view.is_updatable}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No views found in this database
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
