import React, { useEffect, useMemo, useState } from "react";
import { AuthShell, Alert, TextField, PasswordField, Checkbox, SubmitButton, TextLink } from "../components/ui/Auth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

/* =========================================================
   API CONFIG
========================================================= */

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

const USER_API = `${API_BASE}/api/user`;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =========================================================
   LOGIN
========================================================= */

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  /* =======================================================
     STATE
  ======================================================= */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* =======================================================
     SAFE REDIRECT
  ======================================================= */

  const redirectAfterLogin = useMemo(() => {
    const from = location.state?.from;

    if (typeof from === "string" && from.startsWith("/")) {
      return from;
    }

    if (from && typeof from === "object" && typeof from.pathname === "string") {
      return `${from.pathname}${from.search || ""}${from.hash || ""}`;
    }

    return "/";
  }, [location.state]);

  /* =======================================================
     REMEMBERED EMAIL
  ======================================================= */

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("rememberedEmail");

      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (error) {
      console.warn("[Login] Unable to read localStorage.", error);
    }
  }, []);

  /* =======================================================
     INPUT HANDLERS
  ======================================================= */

  const handleEmailChange = (event) => {
    setEmail(event.target.value);

    if (error) {
      setError("");
    }
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);

    if (error) {
      setError("");
    }
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email address is required.");
      return false;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (!password) {
      setError("Password is required.");
      return false;
    }

    return true;
  };

  /* =======================================================
     LOGIN REQUEST
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!API_BASE) {
      setError("API configuration is missing. Please contact support.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${USER_API}/login`,
        {
          email: normalizedEmail,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          timeout: 15000,
        },
      );

      const data = response?.data || {};

      const token = data?.token;
      const profile = data?.user || data?.profile;

      if (!token) {
        throw new Error(
          "Login succeeded but authentication token was not returned.",
        );
      }

      const userData = profile || {
        email: normalizedEmail,
      };

      /* -----------------------------------------------
         Remember email only.
         Never store password.
      ------------------------------------------------ */

      try {
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", normalizedEmail);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
      } catch (storageError) {
        console.warn("[Login] Unable to save remembered email.", storageError);
      }

      /* -----------------------------------------------
         Parent authentication handler
      ------------------------------------------------ */

      if (typeof onLogin === "function") {
        onLogin(userData, rememberMe, token);
      }

      /* -----------------------------------------------
         Clear password from component state
      ------------------------------------------------ */

      setPassword("");
      setShowPassword(false);

      /* -----------------------------------------------
         Navigate
      ------------------------------------------------ */

      navigate(redirectAfterLogin, {
        replace: true,
      });
    } catch (err) {
      console.error("[Login]", err?.response || err);

      const status = err?.response?.status;

      let message = err?.response?.data?.message || err?.response?.data?.error;

      if (!message && status === 400) {
        message = "Please check your email and password.";
      }

      if (!message && status === 401) {
        message = "Invalid email or password.";
      }

      if (!message && status === 403) {
        message = "Your account does not have permission to sign in.";
      }

      if (!message && status === 404) {
        message = "Login service is currently unavailable.";
      }

      if (!message && status === 429) {
        message = "Too many login attempts. Please try again later.";
      }

      if (!message && status >= 500) {
        message = "Server error. Please try again in a few moments.";
      }

      if (!message && !err?.response) {
        message =
          "Unable to connect to server. Please check your internet connection.";
      }

      setError(
        message || "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AuthShell
      title="Log in"
      subtitle="Welcome back to your command library."
      footer={
        <>
          Don’t have an account? <TextLink to="/signup">Sign up</TextLink>
        </>
      }
    >
      {error && <Alert>{error}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          id="email"
          name="email"
          label="Email"
          icon="mail"
          type="email"
          inputMode="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="you@example.com"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          disabled={isLoading}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          labelAside={
            <Link
              to="/forgotpassword"
              className="text-xs font-medium text-accent hover:underline"
            >
              Forgot password?
            </Link>
          }
          show={showPassword}
          onToggle={() => setShowPassword((previous) => !previous)}
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          disabled={isLoading}
        />

        <Checkbox
          id="remember"
          name="remember"
          label="Remember me"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          disabled={isLoading}
        />

        <SubmitButton
          loading={isLoading}
          loadingLabel="Logging in"
          disabled={isLoading || !email.trim() || !password}
        >
          Log in
        </SubmitButton>
      </form>
    </AuthShell>
  );
};

export default Login;
