import React, { createContext, useContext, useEffect, useMemo } from "react";

const ThemeContext = createContext({ theme: "light", toggleTheme: () => {}, setTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try { localStorage.removeItem("theme"); } catch {}
  }, []);

  const value = useMemo(() => ({
    theme: "light",
    setTheme: () => {},
    toggleTheme: () => {},
  }), []);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
