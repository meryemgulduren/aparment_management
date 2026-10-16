import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setUnauthorizedHandler } from "../api/client";
import { authApi } from "../api/endpoints";
import type { User } from "../api/types";

interface AuthContextValue {
  /** undefined: henüz kontrol ediliyor, null: giriş yapılmamış */
  user: User | null | undefined;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // Oturum süresi dolarsa herhangi bir istek 401 alır; kullanıcı girişe düşer.
    setUnauthorizedHandler(() => setUser(null));
    // Çerez JavaScript'ten okunamaz (HttpOnly); oturum var mı diye sunucuya sorulur.
    authApi.me().then(
      ({ user }) => setUser(user),
      () => setUser(null),
    );
  }, []);

  const value: AuthContextValue = {
    user,
    async login(username, password) {
      const result = await authApi.login(username, password);
      setUser(result.user);
    },
    async logout() {
      try {
        await authApi.logout();
      } finally {
        setUser(null);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth, AuthProvider içinde kullanılmalı.");
  return context;
}
