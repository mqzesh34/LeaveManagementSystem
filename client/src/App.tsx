import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";

import LoginPage from "./pages/LoginPage.tsx";
import MainPage from "./pages/MainPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useAuth } from "./context/authContext.tsx";
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

  if (location.pathname !== prevPath) {
    setPrevPath(location.pathname);
    setIsPageLoading(true);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <PageLoader isLoading={isPageLoading} />
      {user && <Sidebar />}

      <div className={`transition-opacity duration-500 ${isPageLoading ? "opacity-0" : "opacity-100"}`}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/main" replace /> : <LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/main" element={<MainPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/management" element={<ManagementPage />} />
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
      <Toaster position="top-left" />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;
