import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import DatabasesPage from '@/pages/DatabasesPage'
import DatabaseStructurePage from '@/pages/DatabaseStructurePage'
import DatabaseOperationsPage from '@/pages/DatabaseOperationsPage'
import TableBrowsePage from '@/pages/TableBrowsePage'
import TableStructurePage from '@/pages/TableStructurePage'
import TableInsertPage from '@/pages/TableInsertPage'
import SQLEditorPage from '@/pages/SQLEditorPage'
import DatabaseSearchPage from '@/pages/DatabaseSearchPage'
import TableSearchPage from '@/pages/TableSearchPage'
import ViewsPage from '@/pages/ViewsPage'
import UsersPage from '@/pages/UsersPage'
import ExportPage from '@/pages/ExportPage'
import ImportPage from '@/pages/ImportPage'
import ServerVariablesPage from '@/pages/ServerVariablesPage'
import ServerStatusPage from '@/pages/ServerStatusPage'
import ServerPrivilegesPage from '@/pages/ServerPrivilegesPage'
import Layout from '@/components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="databases" element={<DatabasesPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="databases/:db" element={<DatabaseStructurePage />} />
        <Route path="databases/:db/sql" element={<SQLEditorPage />} />
        <Route path="databases/:db/operations" element={<DatabaseOperationsPage />} />
        <Route path="databases/:db/search" element={<DatabaseSearchPage />} />
        <Route path="databases/:db/query" element={<SQLEditorPage />} />
        <Route path="databases/:db/views" element={<ViewsPage />} />
        <Route path="databases/:db/export" element={<ExportPage />} />
        <Route path="databases/:db/import" element={<ImportPage />} />
        <Route path="tables/:db/:table/browse" element={<TableBrowsePage />} />
        <Route path="tables/:db/:table/insert" element={<TableInsertPage />} />
        <Route path="tables/:db/:table/structure" element={<TableStructurePage />} />
        <Route path="tables/:db/:table/search" element={<TableSearchPage />} />
        <Route path="tables/:db/:table/sql" element={<SQLEditorPage />} />
        <Route path="tables/:db/:table/import" element={<ImportPage />} />
        <Route path="server/variables" element={<ServerVariablesPage />} />
        <Route path="server/status" element={<ServerStatusPage />} />
        <Route path="server/users" element={<UsersPage />} />
        <Route path="server/privileges" element={<ServerPrivilegesPage />} />
      </Route>
    </Routes>
  )
}
