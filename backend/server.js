import express from "express";
import cors from "cors";
import "dotenv/config";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import hpp from "hpp";

import userRouter from "./routes/userRoute.js";
import connectDB from "./config/db.js";
import contactRoutes from "./routes/contactRoutes.js";
import commandRoutes from "./routes/commandRoutes.js";

// ======================================================
// APP
// ======================================================

const app = express();

const PORT = Number(process.env.PORT) || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";

// ======================================================
// ENVIRONMENT VALIDATION
// ======================================================

const requiredProductionEnv = ["MONGODB_URI", "JWT_SECRET", "CLIENT_URL"];

if (IS_PRODUCTION) {
  const missingVariables = requiredProductionEnv.filter(
    (variable) => !process.env[variable]?.trim(),
  );

  if (missingVariables.length > 0) {
    console.error(
      `[STARTUP ERROR] Missing environment variables: ${missingVariables.join(", ")}`,
    );

    process.exit(1);
  }
}

// ======================================================
// CORS
// ======================================================

const normalizeOrigin = (origin) => {
  if (!origin) return "";

  return origin.trim().replace(/\/+$/, "");
};

const allowedOrigins = [
  !IS_PRODUCTION ? "http://localhost:5173" : null,
  process.env.CLIENT_URL,
]
  .filter(Boolean)
  .map(normalizeOrigin)
  .filter((origin, index, origins) => origins.indexOf(origin) === index);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin header.
    // Useful for curl, Postman and server-to-server calls.
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS blocked"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ======================================================
// TRUST PROXY
// ======================================================

if (IS_PRODUCTION) {
  app.set("trust proxy", 1);
}

// ======================================================
// SECURITY HEADERS
// ======================================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(hpp());

// ======================================================
// COMPRESSION
// ======================================================

app.use(
  compression({
    threshold: 1024,
  }),
);

// ======================================================
// GLOBAL RATE LIMIT
// ======================================================

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: IS_PRODUCTION ? 200 : 1000,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
    });
  },
});

app.use(globalLimiter);

// ======================================================
// AUTH RATE LIMIT
// ======================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: IS_PRODUCTION ? 30 : 100,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },

  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    });
  },
});

app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/forgot-password", authLimiter);
app.use("/api/user/reset-password", authLimiter);
app.use("/api/user/verify-forgot-otp", authLimiter);

// ======================================================
// BODY PARSERS
// ======================================================

app.use(
  express.json({
    limit: "20kb",
    strict: true,
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  }),
);

// ======================================================
// STATIC FILES
// ======================================================

app.use(
  "/uploads",
  express.static("uploads", {
    maxAge: IS_PRODUCTION ? "7d" : 0,

    etag: true,

    lastModified: true,

    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");

      if (IS_PRODUCTION) {
        res.setHeader("Cache-Control", "public, max-age=604800");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

// ======================================================
// API ROUTES
// ======================================================

app.use("/api/commands", commandRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/user", userRouter);

// ======================================================
// ROOT
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense Tracker API is running",
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  // Only real errors are logged.
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);

  // ----------------------------------------------------
  // CORS ERROR
  // ----------------------------------------------------

  if (err?.message === "CORS blocked") {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this request.",
    });
  }

  // ----------------------------------------------------
  // INVALID JSON
  // ----------------------------------------------------

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload.",
    });
  }

  // ----------------------------------------------------
  // PAYLOAD TOO LARGE
  // ----------------------------------------------------

  if (err?.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "Request payload is too large.",
    });
  }

  // ----------------------------------------------------
  // INVALID REQUEST BODY
  // ----------------------------------------------------

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      message: "Invalid request payload.",
    });
  }

  // ----------------------------------------------------
  // STATUS CODE
  // ----------------------------------------------------

  const statusCode = Number(err?.status) || Number(err?.statusCode) || 500;

  const safeStatusCode =
    statusCode >= 400 && statusCode < 600 ? statusCode : 500;

  // ----------------------------------------------------
  // RESPONSE
  // ----------------------------------------------------

  return res.status(safeStatusCode).json({
    success: false,

    message:
      IS_PRODUCTION && safeStatusCode >= 500
        ? "Internal Server Error"
        : err?.message || "Something went wrong.",
  });
});

// ======================================================
// SERVER
// ======================================================

let server = null;
let isShuttingDown = false;

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

const shutdown = (signal, error = null) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  if (error) {
    console.error(`[${signal}]`, error);
  }

  // Server did not start.
  if (!server) {
    process.exit(error ? 1 : 0);
  }

  server.close(() => {
    process.exit(error ? 1 : 0);
  });

  // Force shutdown after 10 seconds.
  setTimeout(() => {
    console.error("[SHUTDOWN] Forced shutdown after 10 seconds.");

    process.exit(1);
  }, 10_000).unref();
};

// ======================================================
// PROCESS SIGNALS
// ======================================================

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

// ======================================================
// UNCAUGHT EXCEPTION
// ======================================================

process.on("uncaughtException", (error) => {
  console.error("[UNCAUGHT EXCEPTION]", error);

  shutdown("uncaughtException", error);
});

// ======================================================
// UNHANDLED REJECTION
// ======================================================

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);

  shutdown("unhandledRejection", reason);
});

// ======================================================
// START SERVER
// ======================================================

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, "0.0.0.0");

    // --------------------------------------------------
    // HTTP TIMEOUTS
    // --------------------------------------------------

    server.keepAliveTimeout = 65_000;

    server.headersTimeout = 66_000;

    server.requestTimeout = 120_000;

    // --------------------------------------------------
    // SERVER ERROR
    // --------------------------------------------------

    server.on("error", (error) => {
      console.error("[SERVER ERROR]", error);

      shutdown("server error", error);
    });
  } catch (error) {
    console.error("[STARTUP ERROR]", error);

    process.exit(1);
  }
};

// ======================================================
// START
// ======================================================

startServer();

// ======================================================
// EXPORT
// ======================================================

export default app;
