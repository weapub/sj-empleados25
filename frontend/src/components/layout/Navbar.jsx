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
                <Nav.Link
                  as={NavLink}
                  to="/"
                  end
                  className="inline-flex items-center justify-start text-left gap-1 px-3 py-1 rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>
                    <FaChartLine size={16} />
                  </span>
                  <span>Dashboard</span>
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/employees"
                  className="inline-flex items-center justify-start text-left gap-1 px-3 py-1 rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>
                    <FaUsers size={16} />
                  </span>
                  <span>Empleados</span>
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/disciplinary"
                  className="inline-flex items-center justify-start text-left gap-1 px-3 py-1 rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>
                    <FaExclamationTriangle size={16} />
                  </span>
                  <span>Medidas Disciplinarias</span>
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/attendance"
                  className="inline-flex items-center justify-start text-left gap-1 px-3 py-1 rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>
                    <FaClock size={16} />
                  </span>
                  <span>Asistencias</span>
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/payroll"
                  className="inline-flex items-center justify-start text-left gap-1 px-3 py-1 rounded-full text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>
                    <FaFileInvoiceDollar size={16} />
                  </span>
                  <span>Recibos</span>
                </Nav.Link>
                <Nav.Link
                  as={NavLink}
                  to="/employee-account"
                  className="inline-flex items-center justify-start text-left gap-1 px-3 py-1 rounded-full text-slate-700 hover:bg-slate-50"
                >
                  <span>
                    <FaWallet size={16} />
                  </span>
                  <span>Cuenta Corriente</span>
                </Nav.Link>
                <Button variant="outline-dark" onClick={logout} className="ms-2 shadow-sm rounded-full px-3 py-1">
                  <FaSignOutAlt /> <span>Cerrar Sesión</span>
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login" className="inline-flex items-center justify-start text-left gap-1 px-2 py-1 hover:bg-slate-50 rounded-md">
                  <FaSignInAlt /> <span>Iniciar Sesión</span>
                </Nav.Link>
                <Nav.Link as={NavLink} to="/register" className="inline-flex items-center justify-start text-left gap-1 px-2 py-1 hover:bg-slate-50 rounded-md">
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