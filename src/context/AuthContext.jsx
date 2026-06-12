import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('employee_token');
    const data = localStorage.getItem('employee_data');
    if (token && data) {
      setEmployee(JSON.parse(data));
    }
    setLoading(false);
  }, []);

  const login = async (storeId, password) => {
    const res = await api.post('/auth/employee/login', { store_id: storeId, password });
    const { token, employee: empData } = res.data;
    localStorage.setItem('employee_token', token);
    localStorage.setItem('employee_data', JSON.stringify(empData));
    setEmployee(empData);
    return empData;
  };

  const logout = () => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee_data');
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ employee, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
