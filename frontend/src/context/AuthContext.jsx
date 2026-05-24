import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContextObject.js";
import {
  getCurrentUser,
  login as loginRequest,
  loginWithGoogle as googleLoginRequest,
  logout as logoutRequest,
} from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("accessToken")));

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      return;
    }

    getCurrentUser()
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await loginRequest(credentials);
    localStorage.setItem("accessToken", response.data.accessToken);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    const response = await googleLoginRequest({ idToken });
    localStorage.setItem("accessToken", response.data.accessToken);
    localStorage.setItem("refreshToken", response.data.refreshToken);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await logoutRequest({ refreshToken });
      } catch {
        // Local logout should still succeed if the server cannot revoke the token.
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, loginWithGoogle, logout, isAuthenticated: Boolean(user) }),
    [user, loading, login, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
