import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/api.types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !role) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  if (role === "student") {
    const requiresPasswordChange = localStorage.getItem("studentRequiresPasswordChange") === "true";
    if (requiresPasswordChange && location.pathname !== "/student/change-password") {
      return <Navigate to="/student/change-password" replace />;
    }
  }

  return <>{children}</>;
}
