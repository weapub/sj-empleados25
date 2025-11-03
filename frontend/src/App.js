import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Componentes
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import EmployeeList from './components/employees/EmployeeList';
import EmployeeForm from './components/employees/EmployeeForm';
import EmployeeDetail from './components/employees/EmployeeDetail';
import AttendancePage from './components/attendance/AttendancePage';
import DisciplinaryList from './components/disciplinary/DisciplinaryList';
import DisciplinaryForm from './components/disciplinary/DisciplinaryForm';
import PayrollList from './components/payroll/PayrollList';
import PayrollForm from './components/payroll/PayrollForm';
import PayrollDetail from './components/payroll/PayrollDetail';
import EmployeeAccountPage from './components/account/EmployeeAccountPage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
    }
  }, [token]);

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
      <div className="App">
        <Navbar isAuthenticated={isAuthenticated} logout={logout} />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/login" element={!isAuthenticated ? <Login login={login} /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <Register login={login} /> : <Navigate to="/" />} />
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
        </div>
      </div>
    </Router>
  );
}

export default App;
