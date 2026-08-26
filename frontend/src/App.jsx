import React, { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import axios from "axios";

// Components
import Login from "./components/Login";
import Signup from "./components/Signup";
import VerifyOtp from "./components/VerifyOtp";
import ForgotPassword from "./components/ForgotPassword";
import CommandLibrary from "./components/CommandLibrary";

// ============================================================
// API CONFIG
// ============================================================

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

const API_USER_URL = `${API_BASE}/api/user`;

// ============================================================
// STORAGE
// ============================================================

const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
};

// ============================================================
// STORAGE HELPERS
// ============================================================

const safeGetItem = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch (error) {
    console.error(`[Storage] Read failed: ${key}`, error);
    return null;
  }
};

const safeSetItem = (storage, key, value) => {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[Storage] Write failed: ${key}`, error);
    return false;
  }
};

const safeRemoveItem = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Remove failed: ${key}`, error);
  }
};

const parseJSON = (value, fallback = null) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// ============================================================
// AUTH STORAGE
// ============================================================

const getStoredAuth = () => {
  const localToken = safeGetItem(localStorage, STORAGE_KEYS.TOKEN);
  const sessionToken = safeGetItem(sessionStorage, STORAGE_KEYS.TOKEN);

  const localUser = parseJSON(
    safeGetItem(localStorage, STORAGE_KEYS.USER),
    null,
  );

  const sessionUser = parseJSON(
    safeGetItem(sessionStorage, STORAGE_KEYS.USER),
    null,
  );

  if (localToken) {
    return {
      token: localToken,
      user: localUser,
      persistent: true,
    };
  }

  if (sessionToken) {
    return {
      token: sessionToken,
      user: sessionUser,
      persistent: false,
    };
  }

  return {
    token: null,
    user: null,
    persistent: false,
  };
};

// ============================================================
// PROTECTED ROUTE
// ============================================================

const ProtectedRoute = ({ user, token, children }) => {
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ============================================================
// PUBLIC ROUTE
// ============================================================

const PublicOnlyRoute = ({ user, token, children }) => {
  if (user && token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ============================================================
// SCROLL
// ============================================================

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return null;
};

// ============================================================
// LOADING
// ============================================================

const LoadingScreen = () => (
  <div
    className="min-h-screen flex items-center justify-center bg-gray-50"
    role="status"
    aria-live="polite"
  >
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// ============================================================
// APP
// ============================================================

const App = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================================
  // AUTH PERSIST
  // ==========================================================

  const persistAuth = useCallback((userData, tokenValue, remember = false) => {
    if (!tokenValue) {
      console.error("[Auth] Missing token.");
      return false;
    }

    const targetStorage = remember ? localStorage : sessionStorage;
    const otherStorage = remember ? sessionStorage : localStorage;

    safeRemoveItem(otherStorage, STORAGE_KEYS.USER);
    safeRemoveItem(otherStorage, STORAGE_KEYS.TOKEN);

    const userSaved = userData
      ? safeSetItem(targetStorage, STORAGE_KEYS.USER, JSON.stringify(userData))
      : true;

    const tokenSaved = safeSetItem(
      targetStorage,
      STORAGE_KEYS.TOKEN,
      tokenValue,
    );

    if (!userSaved || !tokenSaved) {
      return false;
    }

    setUser(userData || null);
    setToken(tokenValue);

    return true;
  }, []);

  // ==========================================================
  // CLEAR AUTH
  // ==========================================================

  const clearAuth = useCallback(() => {
    safeRemoveItem(localStorage, STORAGE_KEYS.USER);
    safeRemoveItem(localStorage, STORAGE_KEYS.TOKEN);
    safeRemoveItem(sessionStorage, STORAGE_KEYS.USER);
    safeRemoveItem(sessionStorage, STORAGE_KEYS.TOKEN);

    setUser(null);
    setToken(null);
  }, []);

  // ==========================================================
  // AUTH BOOTSTRAP
  // ==========================================================

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      const storedAuth = getStoredAuth();

      if (!storedAuth.token) {
        if (mounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      // Show cached user immediately.
      if (mounted) {
        setUser(storedAuth.user || null);
        setToken(storedAuth.token);
      }

      if (!API_BASE) {
        console.error("[Auth] API base URL is missing.");

        if (mounted) {
          clearAuth();
          setIsLoading(false);
        }

        return;
      }

      try {
        const response = await axios.get(`${API_USER_URL}/me`, {
          headers: {
            Authorization: `Bearer ${storedAuth.token}`,
          },
          timeout: 10000,
          params: {
            _t: Date.now(),
          },
        });

        if (!mounted) return;

        const profile = response.data;

        if (!profile) {
          throw new Error("Invalid user profile.");
        }

        persistAuth(profile, storedAuth.token, storedAuth.persistent);
      } catch (error) {
        const status = error?.response?.status;

        console.warn("[Auth] Validation failed:", status || error?.message);

        // Only clear auth when backend confirms invalid token.
        if (mounted && (status === 401 || status === 403)) {
          clearAuth();
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, [clearAuth, persistAuth]);

  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLogin = useCallback(
    (userData, remember, tokenValue) => {
      const success = persistAuth(userData, tokenValue, remember);

      if (!success) {
        console.error("[Login] Authentication persistence failed.");
      }
    },
    [persistAuth],
  );

  // ==========================================================
  // SIGNUP
  // ==========================================================

  const handleSignup = useCallback(
    (userData, remember, tokenValue) => {
      const success = persistAuth(userData, tokenValue, remember);

      if (!success) {
        console.error("[Signup] Authentication persistence failed.");
      }
    },
    [persistAuth],
  );

  // ==========================================================
  // LOADING
  // ==========================================================

  if (isLoading) {
    return <LoadingScreen />;
  }

  // ==========================================================
  // ROUTES
  // ==========================================================

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* PUBLIC HOME */}
        <Route
          path="/"
          element={<CommandLibrary user={user} token={token} />}
        />

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute user={user} token={token}>
              <Login onLogin={handleLogin} />
            </PublicOnlyRoute>
          }
        />

        {/* SIGNUP */}
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute user={user} token={token}>
              <Signup onSignup={handleSignup} />
            </PublicOnlyRoute>
          }
        />

        {/* REGISTER REDIRECT */}
        <Route path="/register" element={<Navigate to="/signup" replace />} />

        {/* OTP */}
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* FORGOT PASSWORD */}
        <Route path="/forgotpassword" element={<ForgotPassword />} />

        {/* BACKWARD COMPATIBILITY */}
        <Route
          path="/ForgotPassword"
          element={<Navigate to="/forgotpassword" replace />}
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
