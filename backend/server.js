const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const { errorHandler } = require("./utils/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Connect DB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrows", borrowRoutes);
app.use("/api/payment", require("./routes/paymentRoutes"));


// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
