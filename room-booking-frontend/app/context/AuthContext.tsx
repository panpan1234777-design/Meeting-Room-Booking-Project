"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mergeUser(data: LoginResponse): User {
  return {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: (data.roles?.[0] as "admin" | "user") ?? "user",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch("/me", {
          method: "GET",
          token: storedToken,

        });

        const mergedUser: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: (data.roles?.[0] as "admin" | "user") ?? "user",
        };

        setUser(mergedUser);
        setToken(storedToken);
        localStorage.setItem("role", mergeUser(data).role);
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data: LoginResponse = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    const merged = mergeUser(data);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("role", mergeUser(data).role);
    localStorage.setItem("user", JSON.stringify(merged));
    setToken(data.access_token);
    setUser(merged);
    router.push("/dashboard");
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ) => {
    const data: LoginResponse = await apiFetch("/register", {
      method: "POST",
      body: JSON.stringify({ name, email, phone, password }),
    });
    const merged = mergeUser(data);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(merged));
    setToken(data.access_token);
    setUser(merged);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      if (token) {
        await apiFetch("/logout", {
          method: "POST",
          token: token,
        });
      }
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
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