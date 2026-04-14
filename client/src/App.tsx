import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LoginPage from "./pages/LoginPage.tsx";
import MainPage from "./pages/MainPage.tsx";

function App() {
  return (
    <>
      <Toaster position="top-left" />
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/main" element={<MainPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
