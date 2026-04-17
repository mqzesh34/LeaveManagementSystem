import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LoginPage from "./pages/LoginPage.tsx";
import MainPage from "./pages/MainPage.tsx";
import CalendarPage from "./pages/CalendarPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { useAuth } from "./context/authContext.tsx";
import ManagementPage from "./pages/ManagementPage.tsx";
import Sidebar from "./components/Sidebar.tsx";

function App() {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-left" />
      <Router>
        {user && <Sidebar />}
        <Routes>
          <Route path="/" element={user ? <Navigate to="/main" replace /> : <LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/main" element={<MainPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/management" element={<ManagementPage />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
