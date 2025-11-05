import axios from 'axios';

// Normalizar base URL: quitar barras finales y sufijo /api si existe,
// y asegurar que todas las llamadas usen siempre /api
const RAW_BASE = import.meta.env.VITE_API_URL || 'https://sj-empleados-system.onrender.com';
const TRIMMED = String(RAW_BASE).replace(/\/+$/, '');
const BASE_NO_API = TRIMMED.replace(/\/api\/?$/i, '');
const API_URL = `${BASE_NO_API}/api`;

// Interceptor global: ante 401, limpiar token y enviar a login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem('token');
      } catch (_) {}
      delete axios.defaults.headers.common['x-auth-token'];
      const isLogin = typeof window !== 'undefined' && window.location?.pathname === '/login';
      if (!isLogin && typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Configurar axios con token
const setAuthToken = token => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

// Servicios de autenticación
export const register = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/register`, userData);
  return response.data;
};

export const login = async (userData) => {
  const response = await axios.post(`${API_URL}/auth/login`, userData);
  return response.data;
};

export const getCurrentUser = async () => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/auth/me`);
  return response.data;
};

// Servicios de empleados
export const getEmployees = async () => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/employees`);
  return response.data;
};

export const getEmployeeById = async (id) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employeeData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.post(`${API_URL}/employees`, employeeData);
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.put(`${API_URL}/employees/${id}`, employeeData);
  return response.data;
};

export const deleteEmployee = async (id) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.delete(`${API_URL}/employees/${id}`);
  return response.data;
};

// Servicios de dashboard
// Permite pasar opciones de axios (por ejemplo, { signal }) para cancelación
export const getDashboardMetrics = async (options = {}) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/dashboard/metrics`, options);
  return response.data;
};

// Servicios de asistencia
export const getAttendances = async () => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/attendance`);
  return response.data;
};

export const getAttendancesByEmployee = async (employeeId) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/attendance/employee/${employeeId}`);
  return response.data;
};

export const createAttendance = async (formData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.post(`${API_URL}/attendance`, formData);
  return response.data;
};

export const updateAttendance = async (id, formData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.put(`${API_URL}/attendance/${id}`, formData);
  return response.data;
};

export const deleteAttendance = async (id) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.delete(`${API_URL}/attendance/${id}`);
  return response.data;
};

// Servicios de medidas disciplinarias
export const createDisciplinary = async (formData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.post(`${API_URL}/disciplinary`, formData);
  return response.data;
};

export const getAllDisciplinaries = async () => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/disciplinary`);
  return response.data;
};

export const getDisciplinariesByEmployee = async (employeeId) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/disciplinary/employee/${employeeId}`);
  return response.data;
};

export const getDisciplinaryById = async (id) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/disciplinary/${id}`);
  return response.data;
};

export const updateDisciplinary = async (id, formData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.put(`${API_URL}/disciplinary/${id}`, formData);
  return response.data;
};

export const deleteDisciplinary = async (id) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.delete(`${API_URL}/disciplinary/${id}`);
  return response.data;
};

// Servicios de recibos de sueldo (payroll)
export const createPayrollReceipt = async (receiptData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.post(`${API_URL}/payroll`, receiptData);
  return response.data;
};

export const getAllPayrollReceipts = async () => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/payroll`);
  return response.data;
};

export const getPayrollReceiptsByEmployee = async (employeeId) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/payroll/employee/${employeeId}`);
  return response.data;
};

export const getPayrollReceiptById = async (id) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/payroll/${id}`);
  return response.data;
};

export const updatePayrollReceipt = async (id, receiptData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.put(`${API_URL}/payroll/${id}`, receiptData);
  return response.data;
};

export const deletePayrollReceipt = async (id) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.delete(`${API_URL}/payroll/${id}`);
  return response.data;
};

// Servicios de eventos de empleados
export const createEmployeeEvent = async (eventData) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.post(`${API_URL}/events`, eventData);
  return response.data;
};

export const getEmployeeEvents = async (employeeId) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/events/employee/${employeeId}`);
  return response.data;
};

// Servicios de cuenta corriente de empleados
export const getEmployeeAccount = async (employeeId) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.get(`${API_URL}/account/employee/${employeeId}`);
  return response.data; // { account, transactions }
};

export const updateWeeklyDeduction = async (employeeId, weeklyDeductionAmount) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.put(`${API_URL}/account/employee/${employeeId}/weekly-deduction`, { weeklyDeductionAmount });
  return response.data;
};

export const addAccountPurchase = async (payload) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.post(`${API_URL}/account/purchase`, payload);
  return response.data;
};

export const addAccountPayment = async (payload) => {
  setAuthToken(localStorage.getItem('token'));
  const response = await axios.post(`${API_URL}/account/payment`, payload);
  return response.data;
};
