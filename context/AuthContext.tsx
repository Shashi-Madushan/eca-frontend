"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { User } from "@/types/models";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser() {
  if (typeof window === "undefined") return null;

  const storedUser = window.localStorage.getItem("eca_user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as User;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    window.localStorage.removeItem("eca_user");
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const router = useRouter();

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("eca_user", JSON.stringify(userData));
    router.push("/dashboard");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("eca_user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading: false }}>
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
