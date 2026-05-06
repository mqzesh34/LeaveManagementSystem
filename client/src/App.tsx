import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

import LoginPage from "./pages/LoginPage.tsx";
import MainPage from "./pages/MainPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useAuth } from "./context/authContext.tsx";
import LeaveManagementPage from "./pages/LeaveManagementPage.tsx";
import ManagementPage from "./pages/ManagementPage.tsx";
import Sidebar from "./components/Sidebar.tsx";
import HistoryLeavesPage from "./pages/HistoryLeavesPage.tsx";
import LeaveRequestPage from "./pages/LeaveRequestPage.tsx";
import PageLoader from "./components/PageLoader.tsx";

const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [prevPath, setPrevPath] = useState(location.pathname);
  const isLoginPage = location.pathname === "/" && !user;
  const skipPageLoader = isLoginPage || Boolean((location.state as any)?.skipPageLoader);
  const effectivePageLoading = !skipPageLoader && isPageLoading;

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsPageLoading(!skipPageLoader);
  }

  useEffect(() => {
    if (skipPageLoader) {
      setIsPageLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname, skipPageLoader]);

  return (
    <>
      <PageLoader isLoading={effectivePageLoading} />
      {user && <Sidebar />}

      <div className={`transition-opacity ${skipPageLoader ? "duration-0" : "duration-500"} ${effectivePageLoading ? "opacity-0" : "opacity-100"}`}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/main" replace /> : <LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/main" element={<MainPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/management" element={<LeaveManagementPage />} />
            <Route path="/admin-management" element={<ManagementPage />} />
            <Route path="/history-leaves" element={<HistoryLeavesPage />} />
            <Route path="/request-leave" element={<LeaveRequestPage />} />
          </Route>
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <>
      <Toaster position="top-left" containerStyle={{ zIndex: 100000 }} />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;
