import "dotenv/config"
import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"

import authRoutes from "./routes/auth.js"
import adminRoutes from "./routes/admin.js"
import queryRoutes from "./routes/query.js"
import contactRoutes from "./routes/contact.js"
import { errorHandler } from "./middleware/errorHandler.js"
import User from "./models/User.js"

dotenv.config()

const app = express()

/* ===========================
   ENV VALIDATION
=========================== */
if (!process.env.MONGODB_URI) {
  console.error("CRITICAL: MONGODB_URI is not set")
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET is not set")
  process.exit(1)
}

/* ===========================
   CORS CONFIG (FIXED)
=========================== */
// CORS CONFIG — FIXED
const allowedOrigins = [
  "http://localhost:5173",
  "https://bioquery-mvp.vercel.app",
  "https://bioquery-mvp.onrender.com",
  "https://bioquery-94wewgxb2-chiragraikar08s-projects.vercel.app",
  "https://bioquery-ablpbr1dl-chiragraikar08s-projects.vercel.app",
]

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (Postman, curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      } else {
        console.error("❌ CORS blocked for origin:", origin)
        return callback(new Error("CORS not allowed"))
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

// IMPORTANT: handle preflights
app.options("*", cors())


/* ===========================
   BODY PARSERS
=========================== */
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

/* ===========================
   MONGODB CONNECTION
=========================== */
let mongoRetries = 0
const maxRetries = 5

const seedDefaultAdmin = async () => {
  try {
    const adminEmail = "bioquery@gmail.com"
    const existingAdmin = await User.findOne({ email: adminEmail })

    if (!existingAdmin) {
      const adminUser = new User({
        email: adminEmail,
        password: "BioQuery@123",
        phone: "+1-800-BIOQUERY",
        role: "admin",
        isVerified: true,
      })
      await adminUser.save()
      console.log("✓ Default admin user created")
    } else {
      console.log("✓ Admin user already exists")
    }
  } catch (error) {
    console.error("Admin seed error:", error.message)
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
      console.error(`✗ MongoDB error (${mongoRetries}/${maxRetries}):`, err.message)

      if (mongoRetries < maxRetries) {
        setTimeout(connectMongoDB, 2000 * mongoRetries)
      } else {
        console.error("CRITICAL: MongoDB connection failed")
        process.exit(1)
      }
    })
}

connectMongoDB()

/* ===========================
   ROUTES
=========================== */
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/query", queryRoutes)
app.use("/api/contact", contactRoutes)

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  })
})

/* ===========================
   ERROR HANDLER
=========================== */
app.use(errorHandler)

/* ===========================
   START SERVER
=========================== */
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
