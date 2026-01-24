import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import OTP from "../models/OTP.js"
import { sendOTP } from "../utils/emailService.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: "Email is required" })
    }

    const otp = generateOTP()

    await OTP.deleteMany({ email })

    const newOTP = new OTP({ email, otp })
    await newOTP.save()

    await sendOTP(email, otp)

    res.json({ message: "OTP sent successfully" })
  } catch (error) {
    console.error("Send OTP error:", error)
    res.status(500).json({ error: error.message || "Failed to send OTP" })
  }
})

// Sign Up
router.post("/signup", async (req, res) => {
  try {
    const { email, otp, phone, password, confirmPassword } = req.body

    if (!email || !otp || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, used: false })

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" })
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "OTP has expired" })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" })
    }

    // Create user
    const user = new User({
      email,
      password,
      phone,
      isVerified: true,
    })

    await user.save()

    // Mark OTP as used
    otpRecord.used = true
    await otpRecord.save()

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" })

    res.json({ token, user: { id: user._id, email: user.email, role: user.role } })
  } catch (error) {
    console.error("Sign up error:", error)
    res.status(500).json({ error: error.message || "Sign up failed" })
  }
})

// Sign In
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" })
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" })

    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("[v0] Sign in error:", error)
    res.status(500).json({ error: error.message || "Sign in failed" })
  }
})

// Create Admin
router.post("/create-admin", async (req, res) => {
  try {
    const adminSecret = req.headers["x-admin-secret"] || req.body.adminSecret

    if (adminSecret !== process.env.ADMIN_CREATION_SECRET) {
      return res.status(403).json({ error: "Unauthorized. Invalid admin creation secret." })
    }

    const { email, password, phone } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: "Admin user already exists" })
    }

    const user = new User({
      email: email.toLowerCase(),
      password,
      phone: phone || "N/A",
      role: "admin",
      isVerified: true,
    })

    await user.save()

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" })

    res.json({
      message: "Admin user created successfully",
      token,
      user: { id: user._id, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("Create admin error:", error)
    res.status(500).json({ error: error.message || "Failed to create admin user" })
  }
})

// Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User not found" })
    }

    const otp = generateOTP()

    await OTP.deleteMany({ email })

    const newOTP = new OTP({ email, otp })
    await newOTP.save()

    await sendOTP(email, otp)

    res.json({ message: "OTP sent to your email" })
  } catch (error) {
    console.error("Forgot password error:", error)
    res.status(500).json({ error: error.message || "Failed to send OTP" })
  }
})

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" })
    }

    const otpRecord = await OTP.findOne({ email, otp, used: false })

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User not found" })
    }

    user.password = password
    await user.save()

    otpRecord.used = true
    await otpRecord.save()

    res.json({ message: "Password reset successfully" })
  } catch (error) {
    console.error("Reset password error:", error)
    res.status(500).json({ error: error.message || "Password reset failed" })
  }
})

// Get User Info (Protected)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: error.message || "Failed to fetch user" })
  }
})

export default router
