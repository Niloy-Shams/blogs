// Fix auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
// import { Cookies } from 'next-client-cookies';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  useEffect(() => {
    // Check if user is authenticated on client side
    const token = localStorage.getItem("accessToken");
    if (token) {
      setAccessToken(token);
      setIsAuthenticated(true);
      
      // Also set cookie for middleware access
      document.cookie = `accessToken=${token}; path=/; max-age=${60*60*24*7}; SameSite=Lax`;
    }
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    // Save to localStorage
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    
    // Also save as cookie for middleware
    document.cookie = `accessToken=${accessToken}; path=/; max-age=${60*60*24*7}; SameSite=Lax`;
    
    setAccessToken(accessToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    
    // Clear cookies
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    
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
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}