import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import LanguageSelection from './pages/LanguageSelection';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import QuizPage from './pages/QuizPage';
import QuizListByLanguage from './pages/QuizListByLanguage';
import AdminPage from './pages/AdminPage';
import OAuthCallback from './pages/OAuthCallback';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-white text-brand-dark bg-app text-app">
            <Toaster position="top-right" />
            <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            
            {/* Protected routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/select-language" element={<LanguageSelection />} />
              <Route path="/quiz" element={<QuizPage />} />
              <Route path="/quiz/:quizId" element={<QuizPage />} />
              <Route path="/quiz-list" element={<QuizListByLanguage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            
            {/* Catch all other routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;