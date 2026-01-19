import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PredictionsPage from "./pages/PredictionsPage";
import RankingsPage from "./pages/RankingsPage";
import ProfilePage from "./pages/ProfilePage";
import Layout from "./components/Layout";

function App() {
  const [username, setUsername] = useState(null);

  useEffect(() => {
    // Verifica se tem usuário salvo no localStorage
    const savedUsername = localStorage.getItem("callclub_username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const handleLogin = (name) => {
    setUsername(name);
    localStorage.setItem("callclub_username", name);
  };

  const handleLogout = () => {
    setUsername(null);
    localStorage.removeItem("callclub_username");
  };

  if (!username) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Layout username={username} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<HomePage username={username} />} />
          <Route path="/predictions" element={<PredictionsPage username={username} />} />
          <Route path="/rankings" element={<RankingsPage username={username} />} />
          <Route path="/profile" element={<ProfilePage username={username} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
