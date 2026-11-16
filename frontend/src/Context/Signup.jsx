import React, { useEffect, useState } from "react";
import { AuthShell, Alert, TextField, PasswordField, Checkbox, SubmitButton, TextLink } from "../components/ui/Auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* =========================================================
   API CONFIGURATION
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
   SIGNUP COMPONENT
========================================================= */

const Signup = () => {
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /* =======================================================
     RESTORE REMEMBERED EMAIL
  ======================================================= */

  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("rememberedEmail");

      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch (storageError) {
      console.warn("[Signup] Unable to read localStorage.", storageError);
    }
  }, []);

  /* =======================================================
     CLEAR FIELD ERROR
  ======================================================= */

  const clearFieldError = (field) => {
    setErrors((previous) => {
      if (!previous[field] && !previous.api) {
        return previous;
      }

      const next = { ...previous };

      delete next[field];

      if (field !== "api") {
        delete next.api;
      }

      return next;
    });
  };

  /* =======================================================
     INPUT HANDLERS
  ======================================================= */

  const handleNameChange = (event) => {
    setName(event.target.value);
    clearFieldError("name");
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    clearFieldError("email");
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    clearFieldError("password");
  };

  /* =======================================================
     VALIDATION
  ======================================================= */

  const validateForm = () => {
    const newErrors = {};

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName) {
      newErrors.name = "Full name is required.";
    } else if (normalizedName.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    } else if (normalizedName.length > 80) {
      newErrors.name = "Name must be less than 80 characters.";
    }

    if (!normalizedEmail) {
      newErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (normalizedEmail.length > 254) {
      newErrors.email = "Email address is too long.";
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    } else if (password.length > 128) {
      newErrors.password = "Password must be less than 128 characters.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* =======================================================
     SIGNUP REQUEST
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!API_BASE) {
      setErrors({
        api: "API configuration is missing. Please contact support.",
      });
      return;
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    setErrors({});

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const response = await axios.post(
        `${USER_API}/register`,
        {
          name: normalizedName,
          email: normalizedEmail,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          signal: controller.signal,
          timeout: 15000,
        },
      );

      const data = response?.data || {};

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
        console.warn("[Signup] Unable to save remembered email.", storageError);
      }

      /* -----------------------------------------------
         Clear sensitive password state
      ------------------------------------------------ */

      setPassword("");
      setShowPassword(false);

      /* -----------------------------------------------
         Navigate to OTP verification
      ------------------------------------------------ */

      navigate("/verify-otp", {
        replace: true,
        state: {
          email: normalizedEmail,
          name: normalizedName,
          registrationResponse: data,
        },
      });
    } catch (err) {
      console.error("[Signup]", err?.response || err);

      const status = err?.response?.status;
      const responseData = err?.response?.data;

      /* -----------------------------------------------
         Backend validation errors
      ------------------------------------------------ */

      if (responseData?.errors) {
        const backendErrors = responseData.errors;

        if (
          typeof backendErrors === "object" &&
          !Array.isArray(backendErrors)
        ) {
          setErrors(backendErrors);
        } else if (Array.isArray(backendErrors)) {
          setErrors({
            api: backendErrors.join(" "),
          });
        } else {
          setErrors({
            api: String(backendErrors),
          });
        }

        return;
      }

      /* -----------------------------------------------
         Common HTTP errors
      ------------------------------------------------ */

      if (status === 400) {
        setErrors({
          api:
            responseData?.message || "Please check your registration details.",
        });
        return;
      }

      if (status === 409) {
        setErrors({
          email:
            responseData?.message ||
            "An account with this email already exists.",
        });
        return;
      }

      if (status === 422) {
        setErrors({
          api:
            responseData?.message ||
            "Please check the information you entered.",
        });
        return;
      }

      if (status === 429) {
        setErrors({
          api: "Too many registration attempts. Please try again later.",
        });
        return;
      }

      if (status >= 500) {
        setErrors({
          api: "Server error. Please try again in a few moments.",
        });
        return;
      }

      /* -----------------------------------------------
         Timeout / cancelled request
      ------------------------------------------------ */

      if (
        err?.code === "ECONNABORTED" ||
        err?.code === "ETIMEDOUT" ||
        err?.name === "CanceledError" ||
        err?.name === "AbortError"
      ) {
        setErrors({
          api: "Request timed out. Please check your connection and try again.",
        });
        return;
      }

      /* -----------------------------------------------
         Network error
      ------------------------------------------------ */

      if (!err?.response) {
        setErrors({
          api: "Unable to connect to server. Please check your internet connection.",
        });
        return;
      }

      /* -----------------------------------------------
         Fallback
      ------------------------------------------------ */

      setErrors({
        api:
          responseData?.message ||
          err?.message ||
          "Unable to create account. Please try again.",
      });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start saving the commands and snippets you use most."
      onBack={() => navigate(-1)}
      backDisabled={isLoading}
      footer={
        <>
          Already have an account? <TextLink to="/login">Log in</TextLink>
        </>
      }
    >
      {errors.api && <Alert>{errors.api}</Alert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          id="name"
          name="name"
          label="Full name"
          icon="user"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Your name"
          autoComplete="name"
          autoCapitalize="words"
          maxLength={80}
          required
          disabled={isLoading}
          error={errors.name}
        />

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
          maxLength={254}
          required
          disabled={isLoading}
          error={errors.email}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          show={showPassword}
          onToggle={() => setShowPassword((previous) => !previous)}
          value={password}
          onChange={handlePasswordChange}
          placeholder="Create a password"
          autoComplete="new-password"
          maxLength={128}
          required
          disabled={isLoading}
          error={errors.password}
          hint="At least 6 characters."
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
          loadingLabel="Creating account"
          disabled={isLoading}
        >
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  );
};

export default Signup;
