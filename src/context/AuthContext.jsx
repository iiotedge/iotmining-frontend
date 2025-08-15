import { createContext, useContext, useState, useEffect } from "react";
import { getToken, saveToken, removeToken } from "../utils/tokenUtils";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(getToken());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());

  const login = (token) => {
    saveToken(token);
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeToken();
    setAuthToken(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const token = getToken();
    setAuthToken(token);
    setIsAuthenticated(!!token);
  }, []);

  return (
    <AuthContext.Provider value={{ authToken, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
