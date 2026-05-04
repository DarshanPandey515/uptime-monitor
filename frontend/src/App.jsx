import React, {useEffect,} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import WebsitesPage from './pages/WebsitesPage';
import DetailWebsitePage from './pages/DetailWebsitePage';
import { useAuthStore } from './utils/authStore';

const ProtectedRoute = ({ children }) => {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    const refresh = useAuthStore((state) => state.refresh);
    const loading = useAuthStore((state) => state.loading);


    useEffect(() => {
        refresh();
    }, []);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/Register" element={<Register />} />
                <Route path="/" element={<Landing />} />

                {/* Dashboard Layout with nested routes */}
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }>
                    {/* This is the default route - shows HomePage */}
                    <Route index element={<HomePage />} />
                    <Route path="websites" element={<WebsitesPage />} />
                    <Route path="websites/:id" element={<DetailWebsitePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </Router>
    );
}

export default App;