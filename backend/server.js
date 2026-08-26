import express from "express";
import cors from "cors";
import "dotenv/config";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
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

// ======================================================
// TRUST PROXY
// Important for Render / Railway / reverse proxies
// ======================================================

if (NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ======================================================
// CORS
// ======================================================

const allowedOrigins = ["http://localhost:5173", process.env.CLIENT_URL]
  .filter(Boolean)
  .map((origin) => origin.trim().replace(/\/$/, ""));

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without Origin
    // Example: Postman, curl, server-to-server
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim().replace(/\/$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn(`❌ CORS blocked: ${origin}`);

    return callback(new Error("CORS blocked"));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],

  optionsSuccessStatus: 204,
};

// IMPORTANT:
// CORS must be registered BEFORE API routes.
app.use(cors(corsOptions));

// ======================================================
// SECURITY
// ======================================================

if (NODE_ENV === "production") {
  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin",
      },
    }),
  );

  app.use(hpp());
}

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

  max: NODE_ENV === "production" ? 200 : 1000,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(globalLimiter);

// ======================================================
// AUTH RATE LIMIT
// ======================================================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: NODE_ENV === "production" ? 30 : 100,

  standardHeaders: "draft-7",

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

app.use("/api/user/login", authLimiter);
app.use("/api/user/register", authLimiter);
app.use("/api/user/forgot-password", authLimiter);
app.use("/api/user/reset-password", authLimiter);

// ======================================================
// BODY PARSER
// ======================================================

app.use(
  express.json({
    limit: "20kb",
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
    maxAge: NODE_ENV === "production" ? "7d" : 0,

    setHeaders: (res) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  }),
);

// ======================================================
// LOGGING
// ======================================================

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
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
    message: "Expense Tracker API is running 🚀",
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("❌ ERROR:", err);

  // CORS error
  if (err.message === "CORS blocked") {
    return res.status(403).json({
      success: false,
      message: "CORS policy blocked this request.",
    });
  }

  // JSON parsing error
  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload.",
    });
  }

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,

    message:
      NODE_ENV === "development"
        ? err.message
        : statusCode === 500
          ? "Internal Server Error"
          : err.message,
  });
});

// ======================================================
// START SERVER
// ======================================================

const server = app.listen(PORT, async () => {
  console.log("");
  console.log("==========================================");
  console.log("🚀 Expense Tracker API");
  console.log("==========================================");
  console.log(`🌍 Environment : ${NODE_ENV}`);
  console.log(`🚪 Port        : ${PORT}`);
  console.log(`🌐 Origins     : ${allowedOrigins.join(", ")}`);
  console.log("==========================================");
  console.log("");

  try {
    await connectDB();

    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error.message);

    // Close server if database connection fails
    server.close(() => {
      process.exit(1);
    });
  }
});

// ======================================================
// GRACEFUL SHUTDOWN
// ======================================================

const shutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log("✅ HTTP server closed.");

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error("❌ Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGINT", () => shutdown("SIGINT"));

process.on("SIGTERM", () => shutdown("SIGTERM"));

// ======================================================
// PROCESS ERRORS
// ======================================================

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:");
  console.error(error);

  shutdown("uncaughtException");
});

process.on("unhandledRejection", (reason) => {
  console.error("❌ UNHANDLED REJECTION:");
  console.error(reason);

  shutdown("unhandledRejection");
});

export default app;
