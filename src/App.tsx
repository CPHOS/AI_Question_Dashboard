import { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ThemeModeProvider, useThemeMode } from './theme/ThemeContext';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/user/Dashboard';
import NewTask from './pages/user/NewTask';
import TaskList from './pages/user/TaskList';
import TaskDetail from './pages/user/TaskDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTokens from './pages/admin/AdminTokens';
import AdminAllTasks from './pages/admin/AdminAllTasks';
import AdminUserTasks from './pages/admin/AdminUserTasks';
import AdminStats from './pages/admin/AdminStats';
import AdminLLMSettings from './pages/admin/AdminLLMSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ThemedApp() {
  const { mode } = useThemeMode();
  const { i18n } = useTranslation();

  const algorithm = useMemo(
    () => (mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm),
    [mode],
  );
  const locale = i18n.language.startsWith('en') ? enUS : zhCN;
  const basename = import.meta.env.BASE_URL.replace(/\/+$/, '');

  return (
    <ConfigProvider
      locale={locale}
      theme={{ algorithm, token: { colorPrimary: '#2f54eb', borderRadius: 6 } }}
    >
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter basename={basename}>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks/new" element={<NewTask />} />
                  <Route path="/tasks" element={<TaskList />} />
                  <Route path="/tasks/:taskId" element={<TaskDetail />} />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users/:userId/tasks"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminUserTasks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/tokens"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminTokens />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/tasks"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminAllTasks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/stats"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminStats />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/llm"
                    element={
                      <ProtectedRoute requireAdmin>
                        <AdminLLMSettings />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export default function App() {
  return (
    <ThemeModeProvider>
      <ThemedApp />
    </ThemeModeProvider>
  );
}
