import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('lunchTrackerUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.expiresAt > Date.now()) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem('lunchTrackerUser');
        }
      } catch (e) {
        localStorage.removeItem('lunchTrackerUser');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    const expiresAt = Date.now() + 3600000; 
    const user = { ...userData, token, expiresAt };
    setUser(user);
    localStorage.setItem('lunchTrackerUser', JSON.stringify(user));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lunchTrackerUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, token: user?.token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);