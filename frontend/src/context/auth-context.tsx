"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
// import { Cookies } from 'next-client-cookies';

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  user: { username: string; isAdmin: boolean } | null;
  login: (accessToken: string, username: string, isAdmin: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; isAdmin: boolean } | null>(null);
  
  useEffect(() => {
    // Check if user is authenticated on client side
    const token = sessionStorage.getItem("accessToken");
    const savedUsername = sessionStorage.getItem("username");
    const savedIsAdmin = sessionStorage.getItem("isAdmin");
    if (token && savedUsername) {
      setAccessToken(token);
      setUser({ 
        username: savedUsername, 
        isAdmin: savedIsAdmin === "true" 
      });
      setIsAuthenticated(true);
    }
  }, []);

  // Function to refresh the access token
  const refreshToken = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          refresh: document.cookie.split('refresh_token=')[1]?.split(';')[0]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Token refresh error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData?.detail || 'Failed to refresh token');
      }

      const data = await response.json();
      console.log('Token refreshed successfully');
      setAccessToken(data.access);
      sessionStorage.setItem("accessToken", data.access);
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout(); // Logout if token refresh fails
    }
  };

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated) {
      // Refresh token every 4 minutes (since token expires in 5 minutes)
      const interval = setInterval(refreshToken, 4 * 60 * 1000);
      // Also refresh immediately when component mounts
      refreshToken();
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const login = (accessToken: string, username: string, isAdmin: boolean) => {
    // Store access token and username in sessionStorage
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("username", username);
    sessionStorage.setItem("isAdmin", isAdmin.toString());
    setAccessToken(accessToken);
    setUser({ username, isAdmin });
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Call the blacklist endpoint to invalidate the refresh token
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      console.log('Calling blacklist endpoint...');
      const response = await fetch(`${baseUrl}/token/blacklist/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Blacklist endpoint error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData?.detail || 'Failed to blacklist token');
      }
      
      console.log('Token blacklisted successfully');
    } catch (error) {
      console.error('Error blacklisting token:', error);
    } finally {
      // Clear tokens and user data
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("isAdmin");
      document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        user,
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