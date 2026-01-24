import "dotenv/config"
import express from "express"
import cors from "cors"
import mongoose from "mongoose"

import authRoutes from "./routes/auth.js"
import adminRoutes from "./routes/admin.js"
import queryRoutes from "./routes/query.js"
import contactRoutes from "./routes/contact.js"
import { errorHandler } from "./middleware/errorHandler.js"
import User from "./models/User.js"

const app = express()

/* =========================
   ENV VALIDATION
========================= */
if (!process.env.MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI is not set")
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET is not set")
  process.exit(1)
}

/* =========================
   🔥 CORS FIX (IMPORTANT)
========================= */
/**
 * MVP / Demo / College Project CORS
 * Allows ALL Vercel + browser origins
 */
app.use(
  cors({
    origin: true, // 🔥 allow all origins
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

// allow preflight requests
app.options("*", cors())

/* =========================
   BODY PARSERS
========================= */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* =========================
   MONGODB CONNECTION
========================= */
let mongoRetries = 0
const maxRetries = 5

const seedDefaultAdmin = async () => {
  try {
    const adminEmail = "bioquery@gmail.com"
    const existingAdmin = await User.findOne({ email: adminEmail })

    if (!existingAdmin) {
      await User.create({
        email: adminEmail,
        password: "BioQuery@123",
        phone: "+1-800-BIOQUERY",
        role: "admin",
        isVerified: true,
      })
      console.log("✓ Default admin user created")
    } else {
      console.log("✓ Admin user already exists")
    }
  } catch (err) {
    console.error("Admin seed error:", err.message)
  }
}

const connectMongoDB = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("✓ MongoDB connected successfully")
      mongoRetries = 0
      seedDefaultAdmin()
    })
    .catch((err) => {
      mongoRetries++
      console.error(
        `✗ MongoDB connection error (${mongoRetries}/${maxRetries}):`,
        err.message
      )

      if (mongoRetries < maxRetries) {
        setTimeout(connectMongoDB, 3000)
      } else {
        console.error("CRITICAL: MongoDB connection failed")
        process.exit(1)
      }
    })
}

connectMongoDB()

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/query", queryRoutes)
app.use("/api/contact", contactRoutes)

/* =========================
   HEALTH CHECK
========================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    time: new Date().toISOString(),
  })
})

/* =========================
   ERROR HANDLER
========================= */
app.use(errorHandler)

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
