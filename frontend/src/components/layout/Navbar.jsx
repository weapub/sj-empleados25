import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { FaUsers, FaChartLine, FaExclamationTriangle, FaClock, FaFileInvoiceDollar, FaWallet, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { BRAND_NAME, BRAND_LOGO_PATH } from '../../config/branding';

const NavbarComponent = ({ isAuthenticated, logout }) => {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <Navbar bg="light" variant="light" expand="lg" className="shadow-sm border-b border-slate-200/70">
      <Container className="py-1 px-2 md:px-4">
        <Navbar.Brand as={Link} to="/" className="font-semibold tracking-tight text-slate-700 inline-flex items-center gap-2">
          {logoOk ? (
            <img
              src={BRAND_LOGO_PATH}
              alt={BRAND_NAME}
              width={22}
              height={22}
              className="rounded shadow-sm align-middle"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <FaUsers />
          )}
          <span>{BRAND_NAME}</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto text-sm">
            {isAuthenticated ? (
              <>
                <Nav.Link as={NavLink} to="/" end className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-1 rounded-full ${isActive ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {({ isActive }) => (<>
                    <FaChartLine size={isActive ? 18 : 16} className="shrink-0" />
                    <span>Dashboard</span>
                  </>)}
                </Nav.Link>
                <Nav.Link as={NavLink} to="/employees" className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-1 rounded-full ${isActive ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {({ isActive }) => (<>
                    <FaUsers size={isActive ? 18 : 16} className="shrink-0" />
                    <span>Empleados</span>
                  </>)}
                </Nav.Link>
                <Nav.Link as={NavLink} to="/disciplinary" className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-1 rounded-full ${isActive ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {({ isActive }) => (<>
                    <FaExclamationTriangle size={isActive ? 18 : 16} className="shrink-0" />
                    <span>Medidas Disciplinarias</span>
                  </>)}
                </Nav.Link>
                <Nav.Link as={NavLink} to="/attendance" className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-1 rounded-full ${isActive ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {({ isActive }) => (<>
                    <FaClock size={isActive ? 18 : 16} className="shrink-0" />
                    <span>Asistencias</span>
                  </>)}
                </Nav.Link>
                <Nav.Link as={NavLink} to="/payroll" className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-1 rounded-full ${isActive ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {({ isActive }) => (<>
                    <FaFileInvoiceDollar size={isActive ? 18 : 16} className="shrink-0" />
                    <span>Recibos</span>
                  </>)}
                </Nav.Link>
                <Nav.Link as={NavLink} to="/employee-account" className={({ isActive }) => `inline-flex items-center gap-2 px-3 py-1 rounded-full ${isActive ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {({ isActive }) => (<>
                    <FaWallet size={isActive ? 18 : 16} className="shrink-0" />
                    <span>Cuenta Corriente</span>
                  </>)}
                </Nav.Link>
                <Button variant="outline-dark" onClick={logout} className="ms-2 shadow-sm rounded-full px-3 py-1">
                  <FaSignOutAlt /> <span>Cerrar Sesión</span>
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login" className="inline-flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded-md">
                  <FaSignInAlt /> <span>Iniciar Sesión</span>
                </Nav.Link>
                <Nav.Link as={NavLink} to="/register" className="inline-flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded-md">
                  <FaUserPlus /> <span>Registrarse</span>
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;