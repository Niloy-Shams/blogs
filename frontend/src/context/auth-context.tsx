// Fix auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
// import { Cookies } from 'next-client-cookies';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if user is authenticated on client side
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (accessToken: string) => {
    // Store access token in sessionStorage
    sessionStorage.setItem("accessToken", accessToken);
    setAccessToken(accessToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear tokens
    sessionStorage.removeItem("accessToken");
    
    // Clear the refresh token cookie by setting it to expire
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    
    setAccessToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}