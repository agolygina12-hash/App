import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MarketProvider } from "./context/MarketContext";
import { NavBar } from "./components/NavBar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { AdvicePage } from "./pages/AdvicePage";
import { CrisisPage } from "./pages/CrisisPage";
import "./App.css";

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, initializing } = useAuth();

  if (initializing) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <MarketProvider>
      <NavBar />
      <main className="app-main">{children}</main>
    </MarketProvider>
  );
}

function AppRoutes() {
  const { user, initializing } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!initializing && user ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={!initializing && user ? <Navigate to="/" replace /> : <RegisterPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/portfolio"
        element={
          <ProtectedLayout>
            <PortfolioPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedLayout>
            <LeaderboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/advice"
        element={
          <ProtectedLayout>
            <AdvicePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/crisis"
        element={
          <ProtectedLayout>
            <CrisisPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
