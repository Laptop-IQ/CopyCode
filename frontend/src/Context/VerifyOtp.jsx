import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AuthShell, Alert, OtpField, ResendRow, SubmitButton } from "../components/ui/Auth";
import { useLocation, useNavigate } from "react-router-dom";

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

/* =========================================================
   VERIFY OTP
========================================================= */

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  /* =======================================================
     STATE
  ======================================================= */

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));

  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState("");

  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);

  const [isLoading, setIsLoading] = useState(false);

  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef([]);

  /* =======================================================
     REDIRECT IF EMAIL IS MISSING
  ======================================================= */

  useEffect(() => {
    if (!email) {
      navigate("/signup", { replace: true });
    }
  }, [email, navigate]);

  /* =======================================================
     AUTO FOCUS FIRST OTP INPUT
  ======================================================= */

  useEffect(() => {
    if (email) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [email]);

  /* =======================================================
     RESEND COUNTDOWN
  ======================================================= */

  useEffect(() => {
    if (resendTimer <= 0) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setResendTimer((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [resendTimer]);

  /* =======================================================
     MASK EMAIL
  ======================================================= */

  const maskedEmail = (() => {
    if (!email || !email.includes("@")) {
      return email;
    }

    const [username, domain] = email.split("@");

    if (username.length <= 2) {
      return `${username[0] || ""}***@${domain}`;
    }

    return `${username.slice(0, 2)}***@${domain}`;
  })();

  /* =======================================================
     UPDATE OTP
  ======================================================= */

  const updateOtp = (index, value) => {
    setOtp((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });

    setError("");
    setResendMessage("");
  };

  /* =======================================================
     HANDLE OTP INPUT
  ======================================================= */

  const handleChange = (event, index) => {
    const rawValue = event.target.value;

    /*
      Keep digits only.
    */

    const value = rawValue.replace(/\D/g, "");

    if (!value) {
      updateOtp(index, "");

      return;
    }

    /*
      If user pastes/types multiple digits,
      distribute them across OTP boxes.
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
      setResendMessage("");

      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);

      inputRefs.current[nextIndex]?.focus();

      return;
    }

    updateOtp(index, value);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* =======================================================
     HANDLE KEY DOWN
  ======================================================= */

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace") {
      if (otp[index]) {
        updateOtp(index, "");
        return;
      }

      if (index > 0) {
        updateOtp(index - 1, "");
        inputRefs.current[index - 1]?.focus();
      }
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /* =======================================================
     HANDLE PASTE
  ======================================================= */

  const handlePaste = (event, index) => {
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
    setResendMessage("");

    const focusIndex = Math.min(index + pastedValue.length, OTP_LENGTH - 1);

    inputRefs.current[focusIndex]?.focus();
  };

  /* =======================================================
     VERIFY OTP
  ======================================================= */

  const handleVerify = async (event) => {
    event?.preventDefault();

    if (isLoading) {
      return;
    }

    const otpString = otp.join("");

    if (otpString.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");

      const firstEmptyIndex = otp.findIndex((digit) => !digit);

      inputRefs.current[firstEmptyIndex >= 0 ? firstEmptyIndex : 0]?.focus();

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

    setIsLoading(true);
    setError("");
    setResendMessage("");

    try {
      const response = await axios.post(
        `${USER_API}/verify-signup-otp`,
        {
          email: email.trim().toLowerCase(),
          otp: otpString,
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

      const token = data.token;
      const user = data.user || data.profile;

      /*
        Authentication token is required.
      */

      if (!token) {
        throw new Error(
          "Verification succeeded but authentication token was not returned.",
        );
      }

      /*
        Save authentication data.
      */

      try {
        localStorage.setItem("token", token);

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
      } catch (storageError) {
        console.error("[VerifyOtp] Storage error:", storageError);

        setError(
          "Verification succeeded, but your session could not be saved. Please try again.",
        );

        return;
      }

      /*
        Clear OTP from state before redirect.
      */

      setOtp(Array(OTP_LENGTH).fill(""));

      /*
        Redirect to dashboard/home.
      */

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      console.error("[VerifyOtp]", err?.response || err);

      const status = err?.response?.status;

      const responseData = err?.response?.data;

      if (status === 400) {
        setError(
          responseData?.message ||
            "Invalid OTP. Please check the code and try again.",
        );
        return;
      }

      if (status === 401) {
        setError(responseData?.message || "The OTP is invalid or has expired.");
        return;
      }

      if (status === 404) {
        setError(
          responseData?.message ||
            "Verification request not found. Please request a new OTP.",
        );
        return;
      }

      if (status === 429) {
        setError("Too many attempts. Please wait and try again.");
        return;
      }

      if (status >= 500) {
        setError("Server error. Please try again in a few moments.");
        return;
      }

      if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
        setError(
          "Request timed out. Please check your connection and try again.",
        );
        return;
      }

      if (!err?.response) {
        setError(
          "Unable to connect to server. Please check your internet connection.",
        );
        return;
      }

      setError(
        responseData?.message ||
          err?.message ||
          "OTP verification failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     RESEND OTP
  ======================================================= */

  const handleResend = async () => {
    if (isResending || isLoading || resendTimer > 0) {
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

    setIsResending(true);
    setError("");
    setResendMessage("");

    try {
      await axios.post(
        `${USER_API}/resend-signup-otp`,
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

      setOtp(Array(OTP_LENGTH).fill(""));
      setResendTimer(RESEND_SECONDS);

      setResendMessage("A new OTP has been sent to your email.");

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      console.error("[VerifyOtp Resend]", err?.response || err);

      const status = err?.response?.status;

      const message = err?.response?.data?.message;

      if (status === 429) {
        setError(
          message ||
            "Too many requests. Please wait before requesting another OTP.",
        );
      } else if (err?.code === "ECONNABORTED" || err?.code === "ETIMEDOUT") {
        setError("Request timed out. Please try again.");
      } else if (!err?.response) {
        setError(
          "Unable to connect to server. Please check your internet connection.",
        );
      } else {
        setError(message || "Failed to resend OTP. Please try again.");
      }
    } finally {
      setIsResending(false);
    }
  };

  /* =======================================================
     GO BACK
  ======================================================= */

  const handleBack = () => {
    if (isLoading || isResending) {
      return;
    }

    navigate("/signup");
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <AuthShell
      icon="mail-check"
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to{" "}
          <strong className="break-all font-medium text-ink" title={email}>
            {maskedEmail}
          </strong>
          .
        </>
      }
      onBack={handleBack}
      backLabel="Use a different email"
      backDisabled={isLoading || isResending}
    >
      {error && <Alert>{error}</Alert>}

      {resendMessage && <Alert tone="success">{resendMessage}</Alert>}

      <form onSubmit={handleVerify} noValidate className="space-y-5">
        <OtpField
          otp={otp}
          disabled={isLoading}
          registerInput={(element, index) => {
            inputRefs.current[index] = element;
          }}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        <SubmitButton loading={isLoading} loadingLabel="Verifying" disabled={isLoading}>
          Verify code
        </SubmitButton>

        <ResendRow
          timer={resendTimer}
          isResending={isResending}
          disabled={isLoading}
          onResend={handleResend}
        />
      </form>
    </AuthShell>
  );
};

export default VerifyOtp;
