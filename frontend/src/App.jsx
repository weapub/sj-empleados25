import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import buildTheme, { SIDEBAR_WIDTH } from './theme';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Navbar  from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer  from './components/layout/Footer';

const Login              = React.lazy(() => import('./components/auth/Login'));
const Register           = React.lazy(() => import('./components/auth/Register'));
const Dashboard          = React.lazy(() => import('./components/dashboard/Dashboard'));
const EmployeeList       = React.lazy(() => import('./components/employees/EmployeeList'));
const EmployeeForm       = React.lazy(() => import('./components/employees/EmployeeForm'));
const EmployeeDetail     = React.lazy(() => import('./components/employees/EmployeeDetail'));
const AttendancePage     = React.lazy(() => import('./components/attendance/AttendancePage'));
const DisciplinaryList   = React.lazy(() => import('./components/disciplinary/DisciplinaryList'));
const DisciplinaryForm   = React.lazy(() => import('./components/disciplinary/DisciplinaryForm'));
const PayrollList        = React.lazy(() => import('./components/payroll/PayrollList'));
const PayrollForm        = React.lazy(() => import('./components/payroll/PayrollForm'));
const PayrollDetail      = React.lazy(() => import('./components/payroll/PayrollDetail'));
const EmployeeAccountPage   = React.lazy(() => import('./components/account/EmployeeAccountPage'));
const PresentismoRecipients = React.lazy(() => import('./components/admin/PresentismoRecipients'));

const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
    <CircularProgress color="primary" />
  </Box>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken]                     = useState(localStorage.getItem('token'));
  const [mobileOpen, setMobileOpen]           = useState(false);
  const [colorMode, setColorMode]             = useState(
    () => localStorage.getItem('colorMode') || 'light'
  );

  const theme = useMemo(() => buildTheme(colorMode), [colorMode]);

  const toggleColorMode = () => {
    setColorMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('colorMode', next);
      return next;
    });
  };

  useEffect(() => {
    if (token) setIsAuthenticated(true);
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>

          {/* Sidebar — solo cuando autenticado */}
          <Sidebar
            isAuthenticated={isAuthenticated}
            logout={logout}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          {/* Área principal */}
          <Box
            component="main"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
              ml: isAuthenticated ? { md: 0 } : 0,
            }}
          >
            <Navbar
              isAuthenticated={isAuthenticated}
              logout={logout}
              onMobileMenuToggle={() => setMobileOpen(prev => !prev)}
              colorMode={colorMode}
              onToggleColorMode={toggleColorMode}
            />

            <Box
              sx={{
                flex: 1,
                p: isAuthenticated ? { xs: 2, sm: 3, md: 4 } : 0,
                maxWidth: isAuthenticated ? 1200 : undefined,
                mx:       isAuthenticated ? 'auto'  : undefined,
                width:    '100%',
              }}
            >
              <React.Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"                      element={isAuthenticated ? <Dashboard />          : <Navigate to="/login" />} />
                  <Route path="/login"                 element={!isAuthenticated ? <Login login={login} /> : <Navigate to="/" />} />
                  <Route path="/register"              element={!isAuthenticated ? <Register login={login} /> : <Navigate to="/" />} />
                  <Route path="/employees"             element={isAuthenticated ? <EmployeeList />        : <Navigate to="/login" />} />
                  <Route path="/employees/new"         element={isAuthenticated ? <EmployeeForm />        : <Navigate to="/login" />} />
                  <Route path="/employees/edit/:id"    element={isAuthenticated ? <EmployeeForm />        : <Navigate to="/login" />} />
                  <Route path="/employees/:id"         element={isAuthenticated ? <EmployeeDetail />      : <Navigate to="/login" />} />
                  <Route path="/attendance/*"          element={isAuthenticated ? <AttendancePage />      : <Navigate to="/login" />} />
                  <Route path="/disciplinary"          element={isAuthenticated ? <DisciplinaryList />    : <Navigate to="/login" />} />
                  <Route path="/disciplinary/new"      element={isAuthenticated ? <DisciplinaryForm />    : <Navigate to="/login" />} />
                  <Route path="/disciplinary/edit/:id" element={isAuthenticated ? <DisciplinaryForm />    : <Navigate to="/login" />} />
                  <Route path="/payroll"               element={isAuthenticated ? <PayrollList />         : <Navigate to="/login" />} />
                  <Route path="/payroll/new"           element={isAuthenticated ? <PayrollForm />         : <Navigate to="/login" />} />
                  <Route path="/payroll/edit/:id"      element={isAuthenticated ? <PayrollForm />         : <Navigate to="/login" />} />
                  <Route path="/payroll/:id"           element={isAuthenticated ? <PayrollDetail />       : <Navigate to="/login" />} />
                  <Route path="/employee-account"      element={isAuthenticated ? <EmployeeAccountPage /> : <Navigate to="/login" />} />
                  <Route path="/admin/presentismo/recipients" element={isAuthenticated ? <PresentismoRecipients /> : <Navigate to="/login" />} />
                </Routes>
              </React.Suspense>
            </Box>

            <Footer />
          </Box>

        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
