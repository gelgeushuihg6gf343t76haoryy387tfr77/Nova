import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const me = await api.get("/auth/me");
    setUser(me);
    return me;
  };

  const loadBusinesses = async () => {
    const data = await api.get("/businesses");
    setBusinesses(data);
    const selected = localStorage.getItem("selected_business_id");
    if (!selected && data[0]?.id) localStorage.setItem("selected_business_id", data[0].id);
    return data;
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([refreshUser(), loadBusinesses()])
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("selected_business_id");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const tokenData = await api.post("/auth/login", { identifier, password });
    localStorage.setItem("auth_token", tokenData.access_token);
    await Promise.all([refreshUser(), loadBusinesses()]);
  };

  const hasBusiness = () => businesses.length > 0;

  const register = async (payload) => {
    return api.post("/auth/register", payload);
  };

  const createBusiness = async (payload) => {
    const business = await api.post("/businesses", payload);
    await loadBusinesses();
    localStorage.setItem("selected_business_id", business.id);
    return business;
  };

  const selectBusiness = (businessId) => {
    localStorage.setItem("selected_business_id", businessId);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("selected_business_id");
    setUser(null);
    setBusinesses([]);
  };

  const value = useMemo(
    () => ({
      user,
      businesses,
      loading,
      login,
      register,
      logout,
      createBusiness,
      selectBusiness,
      hasBusiness: () => businesses.length > 0,
      reloadBusinesses: loadBusinesses,
      refreshUser,
    }),
    [user, businesses, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
