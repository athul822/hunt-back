const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./config/db");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Import security middleware
const { helmetConfig, limiter, loginLimiter } = require("./middleware/security");

// Import routes
const users = require("./routes/users");
const hotels = require("./routes/hotels");
const places = require("./routes/places");
const rooms = require("./routes/rooms");

// Connect to database
connectDB();

const app = express();

// Security headers with Helmet
app.use(helmetConfig);

// Apply global rate limiting
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: "10mb" })); 
app.use(bodyParser.json({ limit: "10mb" }));

// CORS configuration - more permissive for mobile app
const corsOptions = {
  origin: ["https://k-tourism.netlify.app", "http://localhost:8000", "capacitor://localhost", "ionic://localhost"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], 
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};
app.use(cors(corsOptions));

// Apply specific rate limiters to sensitive routes
app.use("/api/user/login", loginLimiter);
app.use("/api/user/google-auth", loginLimiter);

// Basic route
app.get("/", (req, res) => res.send("server is active"));

// API routes
app.use("/api/user", users);
app.use("/api/places", places);
app.use("/api/hotels", hotels);
app.use("/api/rooms", rooms);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.message : 'Server error'
  });
});

const PORT = process.env.PORT || 8000;

// Binding to all network interfaces for better mobile app connectivity
app.listen(PORT, '0.0.0.0', () => {
  console.log(`server is running on http://localhost:${PORT}`);
});

