import React, { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import axios from "axios";

import Login from "./Context/Login";
import Signup from "./Context/Signup";
import VerifyOtp from "./Context/VerifyOtp";
import ForgotPassword from "./Context/ForgotPassword";

import CommandLibrary from "./components/CommandLibrary";
import Layout from "./components/Layout";

/* ============================================================
   API CONFIG
============================================================ */

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

const API_USER_URL = `${API_BASE}/api/user`;

/* ============================================================
   STORAGE KEYS
============================================================ */

const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
};

/* ============================================================
   STORAGE HELPERS
============================================================ */

function safeGetItem(storage, key) {
  try {
    return storage.getItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to read "${key}"`, error);
    return null;
  }
}

function safeSetItem(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to write "${key}"`, error);
    return false;
  }
}

function safeRemoveItem(storage, key) {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.error(`[Storage] Failed to remove "${key}"`, error);
  }
}

function parseJSON(value, fallback = null) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/* ============================================================
   GET STORED AUTH
============================================================ */

function getStoredAuth() {
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
}

/* ============================================================
   CLEAR AUTH
============================================================ */

function clearStoredAuth() {
  safeRemoveItem(localStorage, STORAGE_KEYS.USER);
  safeRemoveItem(localStorage, STORAGE_KEYS.TOKEN);

  safeRemoveItem(sessionStorage, STORAGE_KEYS.USER);
  safeRemoveItem(sessionStorage, STORAGE_KEYS.TOKEN);
}

/* ============================================================
   SCROLL TO TOP
============================================================ */

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [location.pathname]);

  return null;
}

/* ============================================================
   LOADING SCREEN
============================================================ */

function LoadingScreen() {
  return (
    <div
      className="
        min-h-screen
        bg-[#0A0810]
        flex
        items-center
        justify-center
      "
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center">
        <div
          className="
            w-10
            h-10
            rounded-full
            border-2
            border-white/10
            border-t-[#8B72FF]
            animate-spin
          "
        />

        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

/* ============================================================
   PUBLIC ONLY ROUTE
============================================================ */

function PublicOnlyRoute({ user, token, children }) {
  if (user && token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

/* ============================================================
   HOME PAGE
============================================================ */

/*
  IMPORTANT:

  Logged OUT:

      CommandLibrary
      NO Sidebar

  Logged IN:

      Layout
        ├── Sidebar
        └── CommandLibrary
*/

function HomePage({ user, token, onLogout }) {
  /* ---------------- LOGGED IN ---------------- */

  if (user && token) {
    return (
      <Layout user={user} token={token} onLogout={onLogout}>
        <CommandLibrary user={user} token={token} />
      </Layout>
    );
  }

  /* ---------------- LOGGED OUT ---------------- */

  return <CommandLibrary user={null} token={null} />;
}

/* ============================================================
   APP
============================================================ */

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ==========================================================
     PERSIST AUTH
  ========================================================== */

  const persistAuth = useCallback((userData, tokenValue, remember = false) => {
    if (!tokenValue) {
      console.error("[Auth] Token is missing.");

      return false;
    }

    const targetStorage = remember ? localStorage : sessionStorage;

    const otherStorage = remember ? sessionStorage : localStorage;

    /* Remove stale auth from opposite storage */

    safeRemoveItem(otherStorage, STORAGE_KEYS.USER);

    safeRemoveItem(otherStorage, STORAGE_KEYS.TOKEN);

    /* Save user */

    const userSaved = userData
      ? safeSetItem(targetStorage, STORAGE_KEYS.USER, JSON.stringify(userData))
      : true;

    /* Save token */

    const tokenSaved = safeSetItem(
      targetStorage,
      STORAGE_KEYS.TOKEN,
      tokenValue,
    );

    if (!userSaved || !tokenSaved) {
      return false;
    }

    /*
        IMPORTANT:
        Update React auth state immediately.
      */

    setUser(userData || null);
    setToken(tokenValue);

    return true;
  }, []);

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout = useCallback(() => {
    /*
      1. Clear local/session storage
      2. Clear React state
      3. Sidebar disappears automatically
    */

    clearStoredAuth();

    setUser(null);
    setToken(null);
  }, []);

  /* ==========================================================
     AUTH BOOTSTRAP
  ========================================================== */

  useEffect(() => {
    let mounted = true;

    async function bootstrapAuth() {
      const storedAuth = getStoredAuth();

      /* ----------------------------------------------
         No stored login
      ---------------------------------------------- */

      if (!storedAuth.token) {
        if (mounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }

        return;
      }

      /* ----------------------------------------------
         Restore cached auth immediately
      ---------------------------------------------- */

      if (mounted) {
        setUser(storedAuth.user || null);

        setToken(storedAuth.token);
      }

      /* ----------------------------------------------
         API not configured
      ---------------------------------------------- */

      if (!API_BASE) {
        console.warn("[Auth] API base URL is not configured.");

        if (mounted) {
          setIsLoading(false);
        }

        return;
      }

      /* ----------------------------------------------
         Validate token
      ---------------------------------------------- */

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

        console.warn(
          "[Auth] Token validation failed:",
          status || error?.message,
        );

        /*
          Only clear auth if server explicitly
          says token is invalid.
        */

        if (mounted && (status === 401 || status === 403)) {
          clearStoredAuth();

          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      mounted = false;
    };
  }, [persistAuth]);

  /* ==========================================================
     LOGIN
  ========================================================== */

  const handleLogin = useCallback(
    (userData, remember, tokenValue) => {
      const success = persistAuth(userData, tokenValue, remember);

      if (!success) {
        console.error("[Login] Authentication persistence failed.");

        return false;
      }

      /*
        DO NOT navigate here.

        Login.jsx will navigate to "/"
        after this function returns true.

        React state is already updated,
        so HomePage will render:

          Layout
            ├── Sidebar
            └── CommandLibrary
      */

      return true;
    },
    [persistAuth],
  );

  /* ==========================================================
     SIGNUP
  ========================================================== */

  const handleSignup = useCallback(
    (userData, remember, tokenValue) => {
      const success = persistAuth(userData, tokenValue, remember);

      if (!success) {
        console.error("[Signup] Authentication persistence failed.");

        return false;
      }

      return true;
    },
    [persistAuth],
  );

  /* ==========================================================
     INITIAL LOADING
  ========================================================== */

  if (isLoading) {
    return <LoadingScreen />;
  }

  /* ==========================================================
     ROUTES
  ========================================================== */

  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* ==================================================
            HOME
        ================================================== */}

        <Route
          path="/"
          element={
            <HomePage user={user} token={token} onLogout={handleLogout} />
          }
        />

        {/* ==================================================
            LOGIN
        ================================================== */}

        <Route
          path="/login"
          element={
            <PublicOnlyRoute user={user} token={token}>
              <Login onLogin={handleLogin} />
            </PublicOnlyRoute>
          }
        />

        {/* ==================================================
            SIGNUP
        ================================================== */}

        <Route
          path="/signup"
          element={
            <PublicOnlyRoute user={user} token={token}>
              <Signup onSignup={handleSignup} />
            </PublicOnlyRoute>
          }
        />

        {/* ==================================================
            REGISTER
        ================================================== */}

        <Route path="/register" element={<Navigate to="/signup" replace />} />

        {/* ==================================================
            VERIFY OTP
        ================================================== */}

        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* ==================================================
            FORGOT PASSWORD
        ================================================== */}

        <Route path="/forgotpassword" element={<ForgotPassword />} />

        <Route
          path="/ForgotPassword"
          element={<Navigate to="/forgotpassword" replace />}
        />

        {/* ==================================================
            FALLBACK
        ================================================== */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
