const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const blogRoutes = require("./routes/blogRoutes");
const User = require("./models/User");

dotenv.config();

const app = express();

// =====================
// MIDDLEWARE
// =====================
app.use(cors());
app.use(express.json());

// =====================
// ROUTES
// =====================
app.use("/blogs", blogRoutes);

// =====================
// DB CONNECTION
// =====================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Mongo error:", err));

// =====================
// REGISTER
// =====================
app.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    await user.save();

    return res.status(201).json({
      message: "Register successful",
    });

  } catch (err) {
    console.log("REGISTER ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================
// LOGIN
// =====================
app.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================
// DEFAULT ROUTE
// =====================
app.get("/", (req, res) => {
  res.send("Blog API running...");
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});