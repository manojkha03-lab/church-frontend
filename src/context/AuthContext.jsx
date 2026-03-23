import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config/api';

const AuthContext = createContext();
const USER_STORAGE_KEY = 'authUser';

export const useAuth = () => useContext(AuthContext);

const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

const readStoredUser = () => {
  try {
    const value = localStorage.getItem(USER_STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [role, setRole] = useState(() => localStorage.getItem('role'));
  const [authLoading, setAuthLoading] = useState(() => Boolean(localStorage.getItem('token')));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setAuthLoading(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('lastActive');
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  // Session timeout check
  useEffect(() => {
    if (!token) return;

    const checkSession = () => {
      const now = Date.now();
      const loginTime = parseInt(localStorage.getItem('loginTime'), 10);
      const lastActive = parseInt(localStorage.getItem('lastActive'), 10);

      // Hard timeout: 2 hours since login
      if (loginTime && now - loginTime > SESSION_TIMEOUT) {
        logout();
        return;
      }
      // Inactivity timeout: 2 hours since last activity
      if (lastActive && now - lastActive > SESSION_TIMEOUT) {
        logout();
        return;
      }
    };

    // Check every 60 seconds
    checkSession();
    const interval = setInterval(checkSession, 60_000);
    return () => clearInterval(interval);
  }, [token, logout]);

  // Track user activity
  useEffect(() => {
    if (!token) return;

    const updateActivity = () => {
      localStorage.setItem('lastActive', Date.now().toString());
    };

    const events = ['click', 'keydown', 'scroll', 'mousemove'];
    events.forEach(e => document.addEventListener(e, updateActivity, { passive: true }));
    return () => events.forEach(e => document.removeEventListener(e, updateActivity));
  }, [token]);

  useEffect(() => {
    if (token) {
      setAuthLoading(true);
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(async (res) => {
          if (res.status === 401 || res.status === 403) {
            const error = new Error('Unauthorized');
            error.status = res.status;
            throw error;
          }
          if (!res.ok) {
            const error = new Error('Auth refresh failed');
            error.status = res.status;
            throw error;
          }
          return res.json();
        })
        .then((data) => {
          setUser(data);
          setRole(data?.role || null);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
          if (data?.role) {
            localStorage.setItem('role', data.role);
          }
          setAuthLoading(false);
        })
        .catch((err) => {
          console.error('Auth check failed:', err);
          if (err.status === 401 || err.status === 403) {
            logout();
            return;
          }

          const fallbackUser = readStoredUser();
          if (fallbackUser) {
            setUser(fallbackUser);
            setRole(fallbackUser.role || localStorage.getItem('role'));
          }
          setAuthLoading(false);
        });
    } else {
      setUser(null);
      setRole(null);
      setAuthLoading(false);
    }
  }, [token, logout]);

  const login = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    setRole(userData?.role || null);
    setAuthLoading(false);
    localStorage.setItem('token', newToken);
    localStorage.setItem('loginTime', Date.now().toString());
    localStorage.setItem('lastActive', Date.now().toString());
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    if (userData?.role) {
      localStorage.setItem('role', userData.role);
    } else {
      localStorage.removeItem('role');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, role, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};