import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Componentes
import Navbar from './components/layout/Navbar';
// Preview de plantilla Tailwind
const TemplatePreview = React.lazy(() => import('./components/template/TemplatePreview'));
// Carga diferida de vistas principales para reducir el bundle inicial
const Login = React.lazy(() => import('./components/auth/Login'));
const Register = React.lazy(() => import('./components/auth/Register'));
const Dashboard = React.lazy(() => import('./components/dashboard/Dashboard'));
const EmployeeList = React.lazy(() => import('./components/employees/EmployeeList'));
const EmployeeForm = React.lazy(() => import('./components/employees/EmployeeForm'));
const EmployeeDetail = React.lazy(() => import('./components/employees/EmployeeDetail'));
// Carga diferida estándar
const AttendancePage = React.lazy(() => import('./components/attendance/AttendancePage'));
const DisciplinaryList = React.lazy(() => import('./components/disciplinary/DisciplinaryList'));
const DisciplinaryForm = React.lazy(() => import('./components/disciplinary/DisciplinaryForm'));
const PayrollList = React.lazy(() => import('./components/payroll/PayrollList'));
const PayrollForm = React.lazy(() => import('./components/payroll/PayrollForm'));
const PayrollDetail = React.lazy(() => import('./components/payroll/PayrollDetail'));
const EmployeeAccountPage = React.lazy(() => import('./components/account/EmployeeAccountPage'));

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    }
  }, [token]);

  // Permitir deep links autenticados usando ?token= en la URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const qpToken = params.get('token');
      if (qpToken) {
        localStorage.setItem('token', qpToken);
        setToken(qpToken);
        setIsAuthenticated(true);
        // Limpia el token de la URL para evitar fugas en Referer
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url.toString());
      }
    } catch (e) {
      // No interrumpir la app si el parseo falla
      console.warn('URL token parse failed:', e);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <div className="App theme-soft-glass min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <Navbar isAuthenticated={isAuthenticated} logout={logout} />
        <div className="app-shell flex">
          <div className="app-content flex-1">
            <div className="container mt-4 px-4 md:px-6">
              <React.Suspense fallback={<div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border" role="status"><span className="visually-hidden">Cargando...</span></div></div>}>
              <Routes>
                <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/login" element={!isAuthenticated ? <Login login={login} /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <Register login={login} /> : <Navigate to="/" />} />
                {/* Vista de preview de plantilla (solo autenticados) */}
                <Route path="/_template-preview" element={isAuthenticated ? <TemplatePreview /> : <Navigate to="/login" />} />
                <Route path="/employees" element={isAuthenticated ? <EmployeeList /> : <Navigate to="/login" />} />
                <Route path="/employees/new" element={isAuthenticated ? <EmployeeForm /> : <Navigate to="/login" />} />
                <Route path="/employees/edit/:id" element={isAuthenticated ? <EmployeeForm /> : <Navigate to="/login" />} />
                <Route path="/employees/:id" element={isAuthenticated ? <EmployeeDetail /> : <Navigate to="/login" />} />
                <Route path="/attendance/*" element={isAuthenticated ? <AttendancePage /> : <Navigate to="/login" />} />
                <Route path="/disciplinary" element={isAuthenticated ? <DisciplinaryList /> : <Navigate to="/login" />} />
                <Route path="/disciplinary/new" element={isAuthenticated ? <DisciplinaryForm /> : <Navigate to="/login" />} />
                <Route path="/disciplinary/edit/:id" element={isAuthenticated ? <DisciplinaryForm /> : <Navigate to="/login" />} />
                <Route path="/payroll" element={isAuthenticated ? <PayrollList /> : <Navigate to="/login" />} />
                <Route path="/payroll/new" element={isAuthenticated ? <PayrollForm /> : <Navigate to="/login" />} />
                <Route path="/payroll/edit/:id" element={isAuthenticated ? <PayrollForm /> : <Navigate to="/login" />} />
                <Route path="/payroll/:id" element={isAuthenticated ? <PayrollDetail /> : <Navigate to="/login" />} />
                <Route path="/employee-account" element={isAuthenticated ? <EmployeeAccountPage /> : <Navigate to="/login" />} />
              </Routes>
              </React.Suspense>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
