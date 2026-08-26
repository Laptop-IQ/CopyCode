import React, { useState } from "react";
import { loginStyles } from "../assets/dummyStyles";
import { Mail, User, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_URL ||
  ""
).replace(/\/+$/, "");

const USER_API = `${API_BASE}/api/user`;

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectAfterLogin = location.state?.from || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Email and password are required.");
      return;
    }

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

      const data = response.data || {};

      const token = data.token;
      const profile = data.user || data.profile;

      if (!token) {
        throw new Error(
          "Login succeeded but authentication token was not returned.",
        );
      }

      const userData = profile || {
        email: normalizedEmail,
      };

      if (typeof onLogin === "function") {
        onLogin(userData, rememberMe, token);
      }

      setPassword("");

      navigate(redirectAfterLogin, {
        replace: true,
      });
    } catch (err) {
      console.error("[Login]", err?.response || err);

      const status = err?.response?.status;

      let message = err?.response?.data?.message || err?.response?.data?.error;

      if (!message && status === 401) {
        message = "Invalid email or password.";
      }

      if (!message && status === 429) {
        message = "Too many login attempts. Please try again later.";
      }

      if (!message && !err?.response) {
        message = "Unable to connect to server. Please check your connection.";
      }

      setError(message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={loginStyles.pageContainer}>
      <div className={loginStyles.cardContainer}>
        <div className={loginStyles.header}>
          <div className={loginStyles.avatar}>
            <User className="w-10 h-10 text-white" />
          </div>

          <h1 className={loginStyles.headerTitle}>Welcome Back</h1>

          <p className={loginStyles.headerSubtitle}>
            Sign in to your ExpenseTracker account
          </p>
        </div>

        <div className={loginStyles.formContainer}>
          {error && (
            <div
              className={loginStyles.errorContainer}
              role="alert"
              aria-live="polite"
            >
              <div className={loginStyles.errorIcon}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <span className={loginStyles.errorText}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* EMAIL */}
            <div className="mb-6">
              <label htmlFor="email" className={loginStyles.label}>
                Email Address
              </label>

              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Mail className="w-5 h-5" />
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={loginStyles.input}
                  placeholder="your@example.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-6">
              <label htmlFor="password" className={loginStyles.label}>
                Password
              </label>

              <div className={loginStyles.inputContainer}>
                <div className={loginStyles.inputIcon}>
                  <Lock className="w-5 h-5" />
                </div>

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={loginStyles.passwordInput}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className={loginStyles.passwordToggle}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="text-right mt-2">
                <Link
                  to="/forgotpassword"
                  className="text-blue-600 text-sm hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* REMEMBER */}
            <div className={loginStyles.checkboxContainer}>
              <input
                type="checkbox"
                id="remember"
                name="remember"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className={loginStyles.checkbox}
                disabled={isLoading}
              />

              <label htmlFor="remember" className={loginStyles.checkboxLabel}>
                Remember Me
              </label>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className={`${loginStyles.button} ${
                isLoading ? loginStyles.buttonDisabled : ""
              }`}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className={loginStyles.signUpContainer}>
            <p className={loginStyles.signUpText}>
              Don't have an account?{" "}
              <Link to="/signup" className={loginStyles.signUpLink}>
                Create One
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
