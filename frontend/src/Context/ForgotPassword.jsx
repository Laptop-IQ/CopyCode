import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AuthShell, Alert, TextField, PasswordField, OtpField, ResendRow, SubmitButton, TextLink } from "../components/ui/Auth";
import { useNavigate } from "react-router-dom";

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

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* =========================================================
   FORGOT PASSWORD
========================================================= */

const ForgotPassword = () => {
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState(1);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);

  const otpInputRefs = useRef([]);

  /* =======================================================
     RESEND TIMER
  ======================================================= */

  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setResendTimer((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [step, resendTimer]);

  /* =======================================================
     CLEAR MESSAGES
  ======================================================= */

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  /* =======================================================
     EMAIL VALIDATION
  ======================================================= */

  const validateEmail = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Email address is required.");
      return false;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (normalizedEmail.length > 254) {
      setError("Email address is too long.");
      return false;
    }

    return true;
  };

  /* =======================================================
     PASSWORD VALIDATION
  ======================================================= */

  const validatePassword = () => {
    if (!newPassword) {
      setError("New password is required.");
      return false;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }

    if (newPassword.length > 128) {
      setError("Password must be less than 128 characters.");
      return false;
    }

    return true;
  };

  /* =======================================================
     OTP VALIDATION
  ======================================================= */

  const validateOtp = () => {
    const otpString = otp.join("");

    if (otpString.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");

      const firstEmptyIndex = otp.findIndex((digit) => !digit);

      otpInputRefs.current[firstEmptyIndex >= 0 ? firstEmptyIndex : 0]?.focus();

      return false;
    }

    return true;
  };

  /* =======================================================
     SEND OTP
  ======================================================= */

  const handleSendOTP = async (event) => {
    event?.preventDefault();

    if (isLoading) {
      return;
    }

    clearMessages();

    if (!validateEmail()) {
      return;
    }

    if (!API_BASE) {
      setError("API configuration is missing. Please contact support.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${USER_API}/forgot-password`,
        {
          email: normalizedEmail,
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

      setEmail(normalizedEmail);
      setOtp(Array(OTP_LENGTH).fill(""));
      setMessage(data.message || "OTP has been sent to your email.");

      setStep(2);
      setResendTimer(RESEND_SECONDS);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error("[ForgotPassword Send OTP]", err?.response || err);

      const status = err?.response?.status;

      const responseData = err?.response?.data;

      if (status === 400) {
        setError(
          responseData?.message || "Please enter a valid email address.",
        );
      } else if (status === 404) {
        setError(
          responseData?.message ||
            "No account was found with this email address.",
        );
      } else if (status === 429) {
        setError(
          responseData?.message ||
            "Too many requests. Please wait before trying again.",
        );
      } else if (status >= 500) {
        setError("Server error. Please try again in a few moments.");
      } else if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
        setError("Request timed out. Please try again.");
      } else if (!err?.response) {
        setError(
          "Unable to connect to server. Please check your internet connection.",
        );
      } else {
        setError(
          responseData?.message || "Failed to send OTP. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     OTP CHANGE
  ======================================================= */

  const handleOtpChange = (event, index) => {
    const rawValue = event.target.value;

    const value = rawValue.replace(/\D/g, "");

    if (!value) {
      setOtp((previous) => {
        const next = [...previous];
        next[index] = "";
        return next;
      });

      setError("");
      return;
    }

    /*
      Support multi-digit paste/input.
    */

    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH - index);

      setOtp((previous) => {
        const next = [...previous];

        digits.split("").forEach((digit, offset) => {
          next[index + offset] = digit;
        });

        return next;
      });

      setError("");

      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);

      otpInputRefs.current[nextIndex]?.focus();

      return;
    }

    setOtp((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });

    setError("");

    if (index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  /* =======================================================
     OTP KEYBOARD
  ======================================================= */

  const handleOtpKeyDown = (event, index) => {
    if (event.key === "Backspace") {
      if (otp[index]) {
        setOtp((previous) => {
          const next = [...previous];
          next[index] = "";
          return next;
        });

        return;
      }

      if (index > 0) {
        setOtp((previous) => {
          const next = [...previous];
          next[index - 1] = "";
          return next;
        });

        otpInputRefs.current[index - 1]?.focus();
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  /* =======================================================
     OTP PASTE
  ======================================================= */

  const handleOtpPaste = (event, index) => {
    event.preventDefault();

    const pastedValue =
      event.clipboardData
        ?.getData("text")
        ?.replace(/\D/g, "")
        ?.slice(0, OTP_LENGTH) || "";

    if (!pastedValue) {
      return;
    }

    setOtp((previous) => {
      const next = [...previous];

      pastedValue
        .slice(0, OTP_LENGTH - index)
        .split("")
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });

      return next;
    });

    setError("");

    const nextIndex = Math.min(index + pastedValue.length, OTP_LENGTH - 1);

    otpInputRefs.current[nextIndex]?.focus();
  };

  /* =======================================================
     VERIFY OTP + RESET PASSWORD
  ======================================================= */

  const handleVerifyOTP = async (event) => {
    event?.preventDefault();

    if (isLoading) {
      return;
    }

    clearMessages();

    if (!validateOtp()) {
      return;
    }

    if (!validatePassword()) {
      return;
    }

    if (!email) {
      setError("Email address is missing. Please start again.");
      return;
    }

    if (!API_BASE) {
      setError("API configuration is missing. Please contact support.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const otpString = otp.join("");

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${USER_API}/verify-forgot-otp`,
        {
          email: normalizedEmail,
          otp: otpString,
          newPassword,
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

      setMessage(data.message || "Password reset successfully.");

      setOtp(Array(OTP_LENGTH).fill(""));
      setNewPassword("");

      /*
        Give user a moment to see success state,
        then redirect to login.
      */

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
        });
      }, 1200);
    } catch (err) {
      console.error("[ForgotPassword Verify OTP]", err?.response || err);

      const status = err?.response?.status;

      const responseData = err?.response?.data;

      if (status === 400) {
        setError(
          responseData?.message ||
            "Invalid request. Please check your details.",
        );
      } else if (status === 401) {
        setError(responseData?.message || "Invalid or expired OTP.");
      } else if (status === 404) {
        setError(responseData?.message || "Verification request not found.");
      } else if (status === 429) {
        setError(
          responseData?.message || "Too many attempts. Please try again later.",
        );
      } else if (status >= 500) {
        setError("Server error. Please try again in a few moments.");
      } else if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
        setError("Request timed out. Please try again.");
      } else if (!err?.response) {
        setError(
          "Unable to connect to server. Please check your internet connection.",
        );
      } else {
        setError(
          responseData?.message || "OTP verification failed. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     RESEND OTP
  ======================================================= */

  const handleResendOTP = async () => {
    if (isResending || isLoading || resendTimer > 0) {
      return;
    }

    clearMessages();

    if (!email) {
      setError("Email address is missing. Please start again.");
      return;
    }

    if (!API_BASE) {
      setError("API configuration is missing. Please contact support.");
      return;
    }

    setIsResending(true);

    try {
      const response = await axios.post(
        `${USER_API}/forgot-password`,
        {
          email: email.trim().toLowerCase(),
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

      setOtp(Array(OTP_LENGTH).fill(""));
      setNewPassword("");

      setMessage(data.message || "A new OTP has been sent.");

      setResendTimer(RESEND_SECONDS);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error("[ForgotPassword Resend OTP]", err?.response || err);

      const status = err?.response?.status;

      if (status === 429) {
        setError(
          err?.response?.data?.message ||
            "Too many requests. Please wait before trying again.",
        );
      } else if (!err?.response) {
        setError("Unable to connect to server. Please check your connection.");
      } else {
        setError(
          err?.response?.data?.message ||
            "Failed to resend OTP. Please try again.",
        );
      }
    } finally {
      setIsResending(false);
    }
  };

  /* =======================================================
     BACK
  ======================================================= */

  const handleBack = () => {
    if (isLoading || isResending) {
      return;
    }

    if (step === 2) {
      setStep(1);
      setOtp(Array(OTP_LENGTH).fill(""));
      setNewPassword("");
      clearMessages();

      return;
    }

    navigate("/login");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AuthShell
      icon={step === 1 ? "key-2" : "lock-password"}
      title={step === 1 ? "Reset your password" : "Choose a new password"}
      subtitle={
        step === 1 ? (
          "Enter your email and we’ll send you a verification code."
        ) : (
          <>
            Enter the code sent to{" "}
            <strong className="break-all font-medium text-ink">{email}</strong>{" "}
            and set a new password.
          </>
        )
      }
      onBack={handleBack}
      backLabel={step === 1 ? "Back" : "Use a different email"}
      backDisabled={isLoading || isResending}
      footer={
        step === 1 ? (
          <>
            Remember your password? <TextLink to="/login">Log in</TextLink>
          </>
        ) : null
      }
    >
      {message && <Alert tone="success">{message}</Alert>}

      {error && <Alert>{error}</Alert>}

      {step === 1 && (
        <form onSubmit={handleSendOTP} noValidate className="space-y-4">
          <TextField
            id="forgot-email"
            name="email"
            label="Email"
            icon="mail"
            type="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
              setMessage("");
            }}
            placeholder="you@example.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={254}
            required
            disabled={isLoading}
          />

          <SubmitButton loading={isLoading} loadingLabel="Sending code" disabled={isLoading}>
            Send code
          </SubmitButton>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOTP} noValidate className="space-y-5">
          <div className="space-y-3">
            <OtpField
              otp={otp}
              disabled={isLoading}
              registerInput={(element, index) => {
                otpInputRefs.current[index] = element;
              }}
              onChange={handleOtpChange}
              onKeyDown={handleOtpKeyDown}
              onPaste={handleOtpPaste}
            />

            <ResendRow
              timer={resendTimer}
              isResending={isResending}
              disabled={isLoading}
              onResend={handleResendOTP}
            />
          </div>

          <PasswordField
            id="new-password"
            name="newPassword"
            label="New password"
            show={showPassword}
            onToggle={() => setShowPassword((previous) => !previous)}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setError("");
            }}
            placeholder="Enter a new password"
            autoComplete="new-password"
            maxLength={128}
            required
            disabled={isLoading}
            hint="At least 6 characters."
          />

          <SubmitButton loading={isLoading} loadingLabel="Resetting" disabled={isLoading}>
            Reset password
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
