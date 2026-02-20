import { ReactNode, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/hooks/useTheme';
import { LoginPage } from '@/pages/LoginPage';
import { GeneratorPage } from '@/pages/GeneratorPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { AdminPage } from '@/pages/AdminPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { SeriesPage } from '@/pages/SeriesPage';
import { ContentPlanPage } from '@/pages/ContentPlanPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { Onboarding, isOnboardingCompleted } from '@/components/Onboarding';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] dark:bg-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-600 rounded-full" />
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-[#fc3f1d] rounded-full border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    setShowOnboarding(!isOnboardingCompleted())
    
    const handleStartOnboarding = () => {
      setShowOnboarding(true)
    }
    
    window.addEventListener('start-onboarding', handleStartOnboarding)
    return () => window.removeEventListener('start-onboarding', handleStartOnboarding)
  }, [])

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <GeneratorPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/history"
          element={
            <PrivateRoute>
              <HistoryPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/series"
          element={
            <PrivateRoute>
              <SeriesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/content-plan"
          element={
            <PrivateRoute>
              <ContentPlanPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Onboarding run={showOnboarding} onComplete={() => setShowOnboarding(false)} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
