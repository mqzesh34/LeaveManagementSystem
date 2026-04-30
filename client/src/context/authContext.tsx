import React, { createContext, useState, useContext, useEffect } from "react";
import { authApi } from "../services/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  teamId?: number | null;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const data = await authApi.verify();
        if (data.success) {
          setUser(data.user);
        }
      } catch (err) {
        console.log("Aktif oturum bulunamadı.");
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth, AuthProvider içinde kullanılmalı!");
  return context;
};
