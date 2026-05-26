import {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import api, { setTokens, clearTokens, getAccessToken } from "@/services/api";

export type User = {
  id: string;
  email: string;
  name: string;
  check_in_interval_days: number;
  warning_hours_before: number;
  last_check_in: string | null;
  next_deadline: string | null;
  alert_message: string;
  is_active: boolean;
  created_at: string;
};

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get<User>("/api/auth/me");
      setUser(data);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  // On mount, validate existing tokens
  useEffect(() => {
    const init = async () => {
      const token = getAccessToken();
      if (token) {
        await fetchUser();
      }
      setIsLoading(false);
    };
    init();
  }, [fetchUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post("/api/auth/login", { email, password });
      setTokens(data.access_token, data.refresh_token);
      await fetchUser();
    },
    [fetchUser]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const { data } = await api.post("/api/auth/register", {
        email,
        password,
        name,
      });
      setTokens(data.access_token, data.refresh_token);
      await fetchUser();
    },
    [fetchUser]
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    navigate("/");
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
