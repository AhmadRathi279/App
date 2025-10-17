
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import Login from "./components/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Buses from "./pages/Buses";
import AdminDashboard from "./pages/AdminDashboard";


function App() {
  return (
    //<BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admindashboard" element={<AdminDashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/buses" element={<Buses />} />
          </Route>
        </Routes>
      </AuthProvider>
    //</BrowserRouter>
  );
}

export default App;