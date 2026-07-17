import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useDBStore } from "../store/dbStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, isAuthLoading } = useDBStore((state) => state);
  const location = useLocation();

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Restrict client users from certain paths
  if (currentUser.role === "client") {
    if (location.pathname.startsWith("/clients") || location.pathname.startsWith("/settings")) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
