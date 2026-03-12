import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Role } from "@/types/api.types";

interface AuthState {
  token: string | null;
  role: Role | null;
  userId: string | null;
  userName: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (token: string, role: Role, userId: string, userName: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role") as Role | null;
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    return {
      token,
      role,
      userId,
      userName,
      isAuthenticated: !!token,
    };
  });

  const login = useCallback((token: string, role: Role, userId: string, userName: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName);
    setState({ token, role, userId, userName, isAuthenticated: true });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setState({ token: null, role: null, userId: null, userName: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
